import json
import logging
import time
import uuid

from groq import Groq
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from supabase import Client

from config import settings
from database import get_db
from models.schemas import GapAnalysisResponse, GapItem
from services.auth import get_current_user
from services.retrieval import retrieve
from utils.chunker import create_chunks
from utils.parsers import parse_document

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/compare", tags=["Gap Analyzer"])


def _groq_compare(client: Groq, prompt: str, max_retries: int = 3) -> str:
    delay = 5
    for attempt in range(max_retries):
        try:
            resp = client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": (
                        "You are an expert financial compliance auditor. "
                        "You perform precise gap analysis between regulatory documents "
                        "and internal policies. Respond ONLY with the requested YAML block."
                    )},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.1,
                max_tokens=512,
            )
            return resp.choices[0].message.content.strip()
        except Exception as e:
            err_str = str(e)
            is_rate_limit = "429" in err_str or "rate" in err_str.lower() or "quota" in err_str.lower()
            if is_rate_limit and attempt < max_retries - 1:
                logger.warning(f"Groq rate-limit attempt {attempt + 1}/{max_retries}. Sleeping {delay}s")
                time.sleep(delay)
                delay = min(delay * 2, 60)
                continue
            raise
    raise RuntimeError("Groq request failed after all retries.")


@router.post("/gap-analysis", response_model=GapAnalysisResponse)
async def perform_gap_analysis(
    file: UploadFile = File(...),
    department: str = Form(...),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="GROQ_API_KEY is not configured.")

    file_bytes = await file.read()
    temp_id = str(uuid.uuid4())


    pages = parse_document(file_bytes, file.filename)
    if not pages:
        raise HTTPException(
            status_code=400,
            detail=(
                "Failed to extract text from the document. "
                "Please use a text-based PDF, DOCX, or TXT file. "
                "Scanned/image-only PDFs require OCR which may take longer."
            ),
        )

    new_chunks = create_chunks(pages, temp_id, file.filename, department)
    if not new_chunks:
        raise HTTPException(status_code=400, detail="Document parsed but no text chunks could be extracted.")


    analysis_chunks = new_chunks[:5]
    client = Groq(api_key=settings.GROQ_API_KEY)
    gap_items: list[GapItem] = []
    conflicts_count = 0
    gaps_count = 0

    is_admin = current_user["role"] == "admin"


    effective_doc_ids = None
    if not is_admin:
        user_docs_res = db.table("documents").select("doc_id").eq(
            "uploaded_by", current_user["id"]
        ).execute().data or []
        if not user_docs_res:
            raise HTTPException(
                status_code=400,
                detail=(
                    "No internal compliance documents found. "
                    "Please upload your compliance manuals on the Documents page first, "
                    "then run Gap Analysis against them."
                ),
            )
        effective_doc_ids = [d["doc_id"] for d in user_docs_res]
        logger.info(f"[GapAnalyzer] Using {len(effective_doc_ids)} user doc(s) as internal policy base")

    for idx, chunk in enumerate(analysis_chunks):
        new_text = chunk["text"]
        page_num = chunk["metadata"]["page"]


        internal_matches, _ = await retrieve(
            query=new_text,
            top_k=3,
            department=department if is_admin else None,
            doc_ids=effective_doc_ids,
            is_admin=is_admin,
            db=db,
        )

        context_parts = []
        for i, match in enumerate(internal_matches, 1):
            m_meta = match.get("metadata", {})
            context_parts.append(
                f"[Internal Snippet {i} — {m_meta.get('filename')}, Page {m_meta.get('page')}]\n"
                f"{match['text']}"
            )
        internal_context = "\n\n".join(context_parts) if context_parts else "[No relevant internal policies found]"


        prompt = (
            "You are a compliance gap auditor. Analyze the clause below against internal policies.\n\n"
            f"CLAUSE (from {file.filename}, p.{page_num}):\n{new_text[:600]}\n\n"
            f"INTERNAL POLICIES:\n{internal_context[:1200]}\n\n"
            "Output ONLY a single JSON object with these 4 keys (no markdown, no extra text):\n"
            '{"status": "matching" or "conflict" or "gap", '
            '"internal_policy": "doc name + one-line summary, or null", '
            '"explanation": "one sentence: what aligns or what is missing", '
            '"recommendation": "one sentence action required, or null"}'
        )

        try:
            resp_text = _groq_compare(client, prompt)


            clean = resp_text.strip()
            if clean.startswith("```"):
                clean = "\n".join(
                    l for l in clean.split("\n")
                    if not l.strip().startswith("```")
                ).strip()


            start_idx = clean.find("{")
            end_idx = clean.rfind("}")
            parsed: dict = {}
            if start_idx != -1 and end_idx != -1:
                try:
                    parsed = json.loads(clean[start_idx:end_idx + 1])
                except json.JSONDecodeError:
                    logger.warning(f"[GapAnalyzer] JSON parse failed for chunk {idx}, raw: {clean[:100]}")

            status_val = str(parsed.get("status", "gap")).lower()
            if status_val not in ("matching", "conflict", "gap"):
                status_val = "gap"
            policy_val = parsed.get("internal_policy") or "None"
            explanation_val = parsed.get("explanation") or "Analysis could not be completed for this clause."
            recommendation_val = parsed.get("recommendation") or "Manual review recommended."


            explanation_val = str(explanation_val)[:400]
            recommendation_val = str(recommendation_val)[:400]

            if status_val == "conflict":
                conflicts_count += 1
            elif status_val == "gap":
                gaps_count += 1

            gap_items.append(GapItem(
                id=f"gap-{idx}-{uuid.uuid4().hex[:6]}",
                new_rule=f"({file.filename}, Page {page_num}): {new_text[:300]}...",
                internal_policy=policy_val,
                status=status_val,
                explanation=explanation_val,
                recommendation=recommendation_val,
            ))
        except Exception as e:
            logger.error(f"Groq comparison failed for chunk {idx}: {e}")
            gap_items.append(GapItem(
                id=f"gap-err-{idx}",
                new_rule=f"({file.filename}, Page {page_num}): {new_text[:120]}...",
                internal_policy="Error in comparison engine",
                status="gap",
                explanation=f"Error: {e}",
                recommendation="Review manually.",
            ))

    return GapAnalysisResponse(
        filename=file.filename,
        gap_items=gap_items,
        total_findings=len(gap_items),
        conflicts_found=conflicts_count,
        missing_found=gaps_count,
    )
