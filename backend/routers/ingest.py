import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from supabase import Client

from database import get_db
from models.schemas import IngestResponse
from services.auth import get_current_user
from services.ingestion import ingest_document

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ingest", tags=["Ingest"])


@router.post("/upload", response_model=IngestResponse)
async def upload_document(
    file: UploadFile = File(...),
    department: str = Form(...),
    is_global: str = Form("false"),
    description: str = Form(None),
    tags: str = Form(None),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    is_global_bool = is_global.lower() in ("true", "1", "yes")

    if is_global_bool and current_user["role"] != "admin":
        is_global_bool = False

    file_bytes = await file.read()

    try:
        result = await ingest_document(
            file_bytes=file_bytes,
            filename=file.filename,
            department=department,
            is_global=is_global_bool,
            uploaded_by=current_user["id"],
            db=db,
            description=description,
            tags=tags,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"[Ingest] Unexpected error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal error: {e}")
