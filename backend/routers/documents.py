import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from supabase import Client

from database import get_db
from models.schemas import DocumentInfo, DocumentStats, SuccessResponse, UpdateMetadataRequest
from services.auth import get_current_user, require_admin, decode_token
from services.vectorstore import get_collection_stats, delete_doc_chunks
from services.storage import get_storage_client, delete_file
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["Documents"])

MIME_MAP = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "doc": "application/msword",
    "txt": "text/plain",
    "md": "text/markdown",
}


def _to_doc_info(row: dict) -> DocumentInfo:
    return DocumentInfo(
        id=row["id"], doc_id=row["doc_id"], filename=row["filename"],
        file_type=row["file_type"], file_size_bytes=row.get("file_size_bytes", 0),
        chunk_count=row.get("chunk_count", 0), page_count=row.get("page_count", 0),
        department=row["department"], is_global=row.get("is_global", False),
        description=row.get("description"), tags=row.get("tags"),
        expires_at=row.get("expires_at"), version=row.get("version", 1),
        previous_version_id=row.get("previous_version_id"),
        upload_timestamp=row["upload_timestamp"],
        uploaded_by=row.get("uploaded_by"),
    )


@router.get("", response_model=list[DocumentInfo])
async def list_documents(
    department: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    if current_user["role"] == "admin":

        q = db.table("documents").select("*")
        if department:
            q = q.eq("department", department)
    else:

        q = db.table("documents").select("*").eq("uploaded_by", current_user["id"])
    result = q.order("upload_timestamp", desc=True).execute()
    return [_to_doc_info(d) for d in result.data]


@router.get("/stats", response_model=DocumentStats)
async def get_document_stats(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    if current_user["role"] == "admin":

        result = db.table("documents").select("id", count="exact").execute()
        total_docs = result.count or len(result.data)
        vs = get_collection_stats()
    else:

        result = db.table("documents").select("id", count="exact").eq(
            "uploaded_by", current_user["id"]
        ).execute()
        total_docs = result.count or len(result.data)

        doc_ids = [d["id"] for d in result.data]
        if doc_ids:
            chunks_result = db.table("document_chunks").select("id", count="exact").in_(
                "doc_id", [d["doc_id"] for d in
                    db.table("documents").select("doc_id").eq("uploaded_by", current_user["id"]).execute().data
                ]
            ).execute()
            user_chunks = chunks_result.count or len(chunks_result.data)
        else:
            user_chunks = 0
        return DocumentStats(
            total_documents=total_docs,
            total_chunks=user_chunks,
            collection_name="compliance_docs",
        )

    return DocumentStats(
        total_documents=total_docs,
        total_chunks=vs.get("total_chunks", 0),
        collection_name=vs.get("collection_name", "compliance_docs"),
    )


@router.get("/{doc_id}", response_model=DocumentInfo)
async def get_document(
    doc_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    result = db.table("documents").select("*").eq("doc_id", doc_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Document not found")
    doc = result.data[0]

    if current_user["role"] != "admin":
        accessible = (
            doc["department"] == current_user["department"]
            or doc.get("is_global")
            or doc["department"] == "global"
        )
        if not accessible:
            raise HTTPException(status_code=403, detail="Access denied")
    return _to_doc_info(doc)


@router.get("/{doc_id}/file")
async def download_document_file(
    doc_id: str,
    token: Optional[str] = Query(None),
    db: Client = Depends(get_db),
):
    """
    Stream the original file from Supabase Storage.
    Accepts Bearer token in Authorization header OR ?token= query param.
    """

    if not token:
        raise HTTPException(status_code=401, detail="Token required")
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = payload.get("sub", "")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


    result = db.table("documents").select("*").eq("doc_id", doc_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Document not found")
    doc = result.data[0]

    storage_path = doc.get("storage_path")
    if not storage_path:
        raise HTTPException(status_code=404, detail="File not stored — storage path missing")


    try:
        client = get_storage_client()
        file_bytes = client.storage.from_(settings.SUPABASE_BUCKET).download(storage_path)
    except Exception as e:
        logger.error(f"Storage download failed for {storage_path}: {e}")
        raise HTTPException(status_code=404, detail="File not found in storage")

    ext = doc.get("file_type", "").lstrip(".").lower()
    content_type = MIME_MAP.get(ext, "application/octet-stream")
    filename = doc.get("filename", f"{doc_id}.{ext}")

    return Response(
        content=file_bytes,
        media_type=content_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{doc_id}/preview")
async def preview_document(
    doc_id: str,
    token: Optional[str] = Query(None),
    db: Client = Depends(get_db),
):
    """
    Return extracted text content from a document for in-panel preview.
    Returns JSON: { filename, file_type, pages: [{page, text}], total_pages }
    """
    if not token:
        raise HTTPException(status_code=401, detail="Token required")
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    result = db.table("documents").select("*").eq("doc_id", doc_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Document not found")
    doc = result.data[0]

    storage_path = doc.get("storage_path")
    if not storage_path:
        raise HTTPException(status_code=404, detail="Storage path missing")

    try:
        client = get_storage_client()
        file_bytes = client.storage.from_(settings.SUPABASE_BUCKET).download(storage_path)
    except Exception as e:
        logger.error(f"Storage download failed: {e}")
        raise HTTPException(status_code=404, detail="File not found in storage")


    from utils.parsers import parse_document
    filename = doc.get("filename", "document")
    pages = parse_document(file_bytes, filename)

    return {
        "doc_id": doc_id,
        "filename": filename,
        "file_type": doc.get("file_type", ""),
        "pages": pages,
        "total_pages": len(pages),
    }


@router.delete("/{doc_id}", response_model=SuccessResponse)
async def delete_document(
    doc_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    result = db.table("documents").select("*").eq("doc_id", doc_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Document not found")
    doc = result.data[0]

    if current_user["role"] != "admin" and doc.get("uploaded_by") != current_user["id"]:
        raise HTTPException(status_code=403, detail="You can only delete your own documents")


    try:
        delete_doc_chunks(doc_id)
    except Exception as e:
        logger.warning(f"Qdrant delete failed: {e}")


    if doc.get("storage_path"):
        try:
            delete_file(doc["storage_path"])
        except Exception as e:
            logger.warning(f"Storage delete failed: {e}")


    db.table("document_chunks").delete().eq("doc_id", doc_id).execute()

    db.table("documents").delete().eq("doc_id", doc_id).execute()

    return SuccessResponse(message=f"Document '{doc['filename']}' deleted successfully")


@router.patch("/{doc_id}/metadata", response_model=DocumentInfo)
async def update_metadata(
    doc_id: str,
    payload: UpdateMetadataRequest,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    result = db.table("documents").select("*").eq("doc_id", doc_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Document not found")
    doc = result.data[0]

    if current_user["role"] != "admin" and doc.get("uploaded_by") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Permission denied")

    updates = {}
    if payload.description is not None: updates["description"] = payload.description
    if payload.tags is not None: updates["tags"] = payload.tags
    if payload.expires_at is not None: updates["expires_at"] = payload.expires_at.isoformat()
    if payload.department is not None and current_user["role"] == "admin":
        updates["department"] = payload.department
    if payload.is_global is not None and current_user["role"] == "admin":
        updates["is_global"] = payload.is_global

    if updates:
        result = db.table("documents").update(updates).eq("doc_id", doc_id).execute()
        if result.data:
            return _to_doc_info(result.data[0])
    return _to_doc_info(doc)
