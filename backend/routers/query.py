import logging
import time
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from supabase import Client

from config import settings
from database import get_db
from models.schemas import QueryRequest, QueryResponse, SourceChunk
from services.auth import get_current_user
from services.embedding import embed_query
from services.generation import generate_answer
from services.retrieval import retrieve
from services.vectorstore import query_verified_qa

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/query", tags=["RAG Query"])


def _format_sources(chunks: list) -> list[SourceChunk]:
    return [
        SourceChunk(
            text=c.get("text", ""),
            source_doc=c.get("metadata", {}).get("filename", "Unknown"),
            doc_id=c.get("metadata", {}).get("doc_id", ""),
            page=c.get("metadata", {}).get("page", 0),
            chunk_index=c.get("metadata", {}).get("chunk_index", 0),
            relevance_score=round(c.get("score", 0.0), 4),
        )
        for c in chunks
    ]


@router.post("", response_model=QueryResponse)
async def query(
    payload: QueryRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    try:
        return await _handle_query(payload, request, current_user, db)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(f"[Query] Unhandled error: {exc}")
        raise HTTPException(status_code=500, detail=f"Query processing error: {exc}")


async def _handle_query(
    payload: QueryRequest,
    request: Request,
    current_user: dict,
    db: Client,
):
    total_start = time.perf_counter()
    history: list[dict] = []
    now = datetime.now(timezone.utc).isoformat()

    # ── Conversation handling ─────────────────────────────────────────────────
    if payload.conversation_id:
        conv_result = db.table("conversations").select("*").eq(
            "id", payload.conversation_id
        ).eq("user_id", current_user["id"]).execute()
        if not conv_result.data:
            raise HTTPException(status_code=404, detail="Conversation not found")
        conv = conv_result.data[0]

        msgs = db.table("messages").select("role,content").eq(
            "conversation_id", conv["id"]
        ).order("created_at").execute().data

        history = [{"role": m["role"], "content": m["content"]} for m in msgs[-settings.MAX_CONVERSATION_HISTORY:]]
    else:
        title = payload.query[:80] + ("..." if len(payload.query) > 80 else "")
        conv_id = str(uuid.uuid4())
        conv_res = db.table("conversations").insert({
            "id": conv_id, "user_id": current_user["id"],
            "title": title, "created_at": now, "updated_at": now,
        }).execute()
        conv = conv_res.data[0] if conv_res.data else {"id": conv_id}

    # ── Gold Standard Verified QA check ──────────────────────────────────────
    query_emb = embed_query(payload.query)
    verified_qa_id = query_verified_qa(query_emb, threshold=0.85)

    if verified_qa_id:
        vqa_res = db.table("verified_qas").select("*").eq("id", verified_qa_id).execute()
        if vqa_res.data:
            vqa = vqa_res.data[0]
            answer = vqa["answer"] + "\n\n*(Verified Gold Standard Response)*"
            sources = [SourceChunk(
                text=vqa["question"], source_doc="Verified QA Database",
                doc_id=f"verified_qa_{vqa['id']}", page=1, chunk_index=0, relevance_score=1.0,
            )]
            msg_id = str(uuid.uuid4())
            db.table("messages").insert([
                {"id": str(uuid.uuid4()), "conversation_id": conv["id"], "role": "user",
                 "content": payload.query, "created_at": now},
                {"id": msg_id, "conversation_id": conv["id"], "role": "assistant",
                 "content": answer, "sources": [s.model_dump() for s in sources], "created_at": now},
            ]).execute()
            db.table("conversations").update({"updated_at": now}).eq("id", conv["id"]).execute()

            total_ms = (time.perf_counter() - total_start) * 1000
            db.table("audit_logs").insert({
                "id": str(uuid.uuid4()), "user_id": current_user["id"],
                "conversation_id": conv["id"], "action": "query",
                "query_text": payload.query, "status": "success",
                "total_chunks_retrieved": 1, "timestamp": now,
            }).execute()
            return QueryResponse(
                answer=answer, sources=sources,
                conversation_id=conv["id"], message_id=msg_id,
                query=payload.query, model_used="verified_qa_database",
                retrieval_time_ms=0, generation_time_ms=0,
                total_time_ms=round(total_ms, 2), chunks_retrieved=1,
            )

    # ── Hybrid retrieval ──────────────────────────────────────────────────────
    is_admin = current_user["role"] == "admin"

    # For non-admin users, restrict search to only their own uploaded documents
    effective_doc_ids = payload.doc_filter
    user_has_docs = True
    if not is_admin and not effective_doc_ids:
        user_docs = db.table("documents").select("doc_id").eq(
            "uploaded_by", current_user["id"]
        ).execute().data or []
        if user_docs:
            effective_doc_ids = [d["doc_id"] for d in user_docs]
        else:
            user_has_docs = False
            effective_doc_ids = ["__no_docs__"]

    chunks, retrieval_time = await retrieve(
        query=payload.query,
        top_k=payload.top_k,
        department=current_user["department"] if is_admin else None,
        doc_ids=effective_doc_ids,
        is_admin=is_admin,
        db=db,
    )

    # ── Generation ────────────────────────────────────────────────────────────
    # Provide a context-aware message when no chunks found
    if not chunks and not user_has_docs:
        answer = (
            "You haven't uploaded any compliance documents yet. "
            "Please go to the Documents page and upload a document to get started."
        )
        gen_time = 0.0
    elif not chunks:
        answer = (
            "No relevant content was found in your documents for this query. "
            "Try rephrasing your question or make sure the relevant document is uploaded."
        )
        gen_time = 0.0
    else:
        answer, gen_time = generate_answer(
            query=payload.query,
            chunks=chunks,
            conversation_history=history,
        )


    # ── Sanitize all text: null bytes (\u0000) crash PostgreSQL text columns ──────
    # Source: can come from PDF chunk text in Qdrant/Supabase, or from LLM output
    def _san(text: str) -> str:
        if not isinstance(text, str):
            return text
        return text.replace('\x00', '').replace('\u0000', '')

    # Sanitize chunk texts (from stored PDFs — the most common source of null bytes)
    for chunk in chunks:
        if "text" in chunk:
            chunk["text"] = _san(chunk["text"])
        meta = chunk.get("metadata", {})
        for k, v in meta.items():
            if isinstance(v, str):
                meta[k] = _san(v)

    sources = _format_sources(chunks) if payload.include_sources else []

    # Sanitize source texts before JSON serialization
    sources_raw = []
    for s in sources:
        sd = s.model_dump()
        sd["text"] = _san(sd.get("text", ""))
        sources_raw.append(sd)

    msg_id = str(uuid.uuid4())
    safe_answer = _san(answer)
    safe_query = _san(payload.query)


    db.table("messages").insert([
        {"id": str(uuid.uuid4()), "conversation_id": conv["id"], "role": "user",
         "content": safe_query, "created_at": now},
        {"id": msg_id, "conversation_id": conv["id"], "role": "assistant",
         "content": safe_answer, "sources": sources_raw, "created_at": now},
    ]).execute()
    db.table("conversations").update({"updated_at": now}).eq("id", conv["id"]).execute()

    total_ms = (time.perf_counter() - total_start) * 1000
    status = "success" if chunks else "no_results"

    db.table("audit_logs").insert({
        "id": str(uuid.uuid4()), "user_id": current_user["id"],
        "conversation_id": conv["id"], "action": "query",
        "query_text": safe_query, "answer_text": safe_answer[:500],
        "retrieval_time_ms": retrieval_time, "generation_time_ms": gen_time,
        "total_chunks_retrieved": len(chunks),
        "ip_address": request.client.host if request.client else None,
        "status": status, "timestamp": now,
    }).execute()

    return QueryResponse(
        answer=safe_answer, sources=sources,
        conversation_id=conv["id"], message_id=msg_id,
        query=safe_query, model_used=settings.GROQ_MODEL,
        retrieval_time_ms=retrieval_time, generation_time_ms=gen_time,
        total_time_ms=round(total_ms, 2), chunks_retrieved=len(chunks),
    )

