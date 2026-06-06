import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client

from database import get_db
from models.schemas import (
    AuditLogSchema, CreateVerifiedQARequest, SuccessResponse,
    SystemStats, VerifiedQASchema,
)
from services.auth import require_admin
from services.embedding import embed_query
from services.vectorstore import delete_verified_qa, get_collection_stats, upsert_verified_qa

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["Admin"])


def _to_audit(row: dict) -> AuditLogSchema:
    return AuditLogSchema(
        id=row["id"], user_id=row.get("user_id"), conversation_id=row.get("conversation_id"),
        action=row["action"], query_text=row.get("query_text"), status=row["status"],
        retrieval_time_ms=row.get("retrieval_time_ms"), generation_time_ms=row.get("generation_time_ms"),
        total_chunks_retrieved=row.get("total_chunks_retrieved"), ip_address=row.get("ip_address"),
        error_message=row.get("error_message"), timestamp=row["timestamp"],
    )


def _to_vqa(row: dict) -> VerifiedQASchema:
    return VerifiedQASchema(
        id=row["id"], question=row["question"], answer=row["answer"],
        department=row["department"], created_at=row["created_at"], updated_at=row["updated_at"],
    )


@router.get("/audit-logs", response_model=list[AuditLogSchema])
async def get_audit_logs(
    limit: int = Query(50, le=500),
    offset: int = Query(0),
    action: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    admin: dict = Depends(require_admin),
    db: Client = Depends(get_db),
):
    q = db.table("audit_logs").select("*")
    if action:
        q = q.eq("action", action)
    if user_id:
        q = q.eq("user_id", user_id)
    if status:
        q = q.eq("status", status)
    result = q.order("timestamp", desc=True).range(offset, offset + limit - 1).execute()
    return [_to_audit(log) for log in result.data]


@router.get("/system-stats", response_model=SystemStats)
async def get_system_stats(
    admin: dict = Depends(require_admin),
    db: Client = Depends(get_db),
):
    total_users = db.table("users").select("id", count="exact").execute().count or 0
    active_users = db.table("users").select("id", count="exact").eq("is_active", True).execute().count or 0
    total_docs = db.table("documents").select("id", count="exact").execute().count or 0
    global_docs = db.table("documents").select("id", count="exact").or_(
        "is_global.eq.true,department.eq.global"
    ).execute().count or 0
    total_convs = db.table("conversations").select("id", count="exact").execute().count or 0
    total_msgs = db.table("messages").select("id", count="exact").execute().count or 0
    total_queries = db.table("audit_logs").select("id", count="exact").eq("action", "query").execute().count or 0
    no_results = db.table("audit_logs").select("id", count="exact").eq("action", "query").eq("status", "no_results").execute().count or 0

    success_rate = round((total_queries - no_results) / total_queries * 100, 1) if total_queries > 0 else 0.0
    vs = get_collection_stats()

    return SystemStats(
        users={"total": total_users, "active": active_users, "inactive": total_users - active_users},
        documents={"total": total_docs, "global": global_docs, "department_specific": total_docs - global_docs},
        conversations={"total": total_convs, "total_messages": total_msgs},
        queries={"total": total_queries, "no_results": no_results, "success_rate": success_rate},
        vector_store={"total_chunks": vs.get("total_chunks", 0), "collection_name": vs.get("collection_name", "")},
    )


@router.get("/verified-qa", response_model=list[VerifiedQASchema])
async def list_verified_qa(
    admin: dict = Depends(require_admin),
    db: Client = Depends(get_db),
):
    result = db.table("verified_qas").select("*").order("created_at", desc=True).execute()
    return [_to_vqa(qa) for qa in result.data]


@router.post("/verified-qa", response_model=VerifiedQASchema, status_code=201)
async def create_verified_qa(
    payload: CreateVerifiedQARequest,
    admin: dict = Depends(require_admin),
    db: Client = Depends(get_db),
):
    now = datetime.now(timezone.utc).isoformat()
    qa_id = str(uuid.uuid4())
    row = {
        "id": qa_id, "question": payload.question, "answer": payload.answer,
        "department": payload.department, "created_by": admin["id"],
        "created_at": now, "updated_at": now,
    }
    result = db.table("verified_qas").insert(row).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create verified QA")

    embedding = embed_query(payload.question)
    upsert_verified_qa(qa_id, embedding, payload.question, payload.department)
    return _to_vqa(result.data[0])


@router.put("/verified-qa/{qa_id}", response_model=VerifiedQASchema)
async def update_verified_qa(
    qa_id: str,
    payload: CreateVerifiedQARequest,
    admin: dict = Depends(require_admin),
    db: Client = Depends(get_db),
):
    now = datetime.now(timezone.utc).isoformat()
    result = db.table("verified_qas").update({
        "question": payload.question, "answer": payload.answer,
        "department": payload.department, "updated_at": now,
    }).eq("id", qa_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Verified QA not found")
    embedding = embed_query(payload.question)
    upsert_verified_qa(qa_id, embedding, payload.question, payload.department)
    return _to_vqa(result.data[0])


@router.delete("/verified-qa/{qa_id}", response_model=SuccessResponse)
async def delete_verified_qa_entry(
    qa_id: str,
    admin: dict = Depends(require_admin),
    db: Client = Depends(get_db),
):
    result = db.table("verified_qas").select("id").eq("id", qa_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Verified QA not found")
    db.table("verified_qas").delete().eq("id", qa_id).execute()
    delete_verified_qa(qa_id)
    return SuccessResponse(message="Verified QA deleted")
