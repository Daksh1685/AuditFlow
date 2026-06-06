import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from supabase import Client

from config import settings
from models.schemas import IngestResponse
from services.embedding import embed_texts
from services.storage import upload_file, delete_file
from services.vectorstore import upsert_chunks, delete_doc_chunks
from utils.chunker import create_chunks
from utils.hashing import sha256_hash
from utils.parsers import parse_document

logger = logging.getLogger(__name__)


async def ingest_document(
    file_bytes: bytes,
    filename: str,
    department: str,
    is_global: bool,
    uploaded_by: str,
    db: Client,
    description: Optional[str] = None,
    tags: Optional[str] = None,
) -> IngestResponse:
    """Full ingestion pipeline: hash → store → parse → chunk → embed → Qdrant → Supabase DB"""
    ext = Path(filename).suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise ValueError(f"File type '{ext}' not allowed. Allowed: {settings.ALLOWED_EXTENSIONS}")

    file_size = len(file_bytes)
    if file_size > settings.UPLOAD_MAX_SIZE_MB * 1024 * 1024:
        raise ValueError(f"File size {file_size/(1024*1024):.1f}MB exceeds limit of {settings.UPLOAD_MAX_SIZE_MB}MB")


    file_hash = sha256_hash(file_bytes)
    existing = db.table("documents").select("doc_id").eq("file_hash", file_hash).eq(
        "uploaded_by", uploaded_by
    ).execute()
    if existing.data:
        raise ValueError("You have already uploaded this exact file before (duplicate detected).")


    doc_id = str(uuid.uuid4())
    effective_dept = "global" if is_global else department


    storage_path = f"{effective_dept}/{doc_id}/{filename}"
    content_type_map = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".txt": "text/plain",
        ".md": "text/markdown",
    }
    try:
        upload_file(file_bytes, storage_path, content_type_map.get(ext, "application/octet-stream"))
    except Exception as e:
        raise ValueError(f"File storage failed: {e}")


    pages = parse_document(file_bytes, filename)
    if not pages:
        delete_file(storage_path)
        raise ValueError(
            "Failed to extract text. Use a text-based PDF, DOCX, or TXT. "
            "Scanned PDFs need OCR (Gemini fallback, takes longer)."
        )


    chunks = create_chunks(pages, doc_id, filename, department, is_global)
    if not chunks:
        delete_file(storage_path)
        raise ValueError("Document parsed but produced no text chunks.")


    texts = [c["text"] for c in chunks]
    embeddings = embed_texts(texts)


    upsert_chunks(doc_id=doc_id, chunks=chunks, embeddings=embeddings)


    now = datetime.now(timezone.utc).isoformat()
    doc_row = {
        "id": str(uuid.uuid4()),
        "doc_id": doc_id,
        "filename": filename,
        "file_hash": file_hash,
        "file_type": ext.lstrip("."),
        "file_size_bytes": file_size,
        "storage_path": storage_path,
        "chunk_count": len(chunks),
        "page_count": len(pages),
        "department": effective_dept,
        "is_global": is_global,
        "description": description,
        "tags": tags,
        "uploaded_by": uploaded_by,
        "upload_timestamp": now,
        "version": 1,
    }
    try:
        db.table("documents").insert(doc_row).execute()
    except Exception as db_err:
        err_str = str(db_err)

        try:
            delete_doc_chunks(doc_id)
        except Exception:
            pass
        try:
            delete_file(storage_path)
        except Exception:
            pass
        if "file_hash" in err_str and "duplicate" in err_str.lower():
            raise ValueError(
                "This file has already been uploaded by another user in the system. "
                "If you need access to it, please contact your administrator."
            )
        raise ValueError(f"Database error while saving document: {db_err}")


    try:
        chunk_rows = [
            {
                "id": str(uuid.uuid4()),
                "doc_id": doc_id,
                "chunk_index": c["metadata"]["chunk_index"],
                "content": c["text"],
                "page_num": c["metadata"]["page"],
            }
            for c in chunks
        ]

        for i in range(0, len(chunk_rows), 100):
            db.table("document_chunks").insert(chunk_rows[i:i+100]).execute()
    except Exception as e:
        logger.warning(f"[Ingest] document_chunks save failed (keyword search degraded): {e}")

    logger.info(
        f"[Ingest] ✓ {filename} | doc_id={doc_id} | "
        f"pages={len(pages)} | chunks={len(chunks)} | dept={effective_dept}"
    )

    return IngestResponse(
        doc_id=doc_id,
        filename=filename,
        file_type=ext.lstrip("."),
        total_chunks=len(chunks),
        pages_processed=len(pages),
        status="success",
        message=f"Successfully ingested {filename} with {len(chunks)} chunks.",
    )
