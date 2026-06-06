import logging
from typing import Optional

from supabase import create_client, Client

from config import settings

logger = logging.getLogger(__name__)

_client: Optional[Client] = None


def get_storage_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        logger.info("Supabase Storage client connected")
    return _client


def upload_file(file_bytes: bytes, storage_path: str, content_type: str = "application/octet-stream") -> str:
    """Upload file bytes to Supabase Storage. Returns the storage path."""
    client = get_storage_client()
    try:
        client.storage.from_(settings.SUPABASE_BUCKET).upload(
            path=storage_path,
            file=file_bytes,
            file_options={"content-type": content_type, "upsert": "true"},
        )
        logger.info(f"[Storage] Uploaded: {storage_path}")
        return storage_path
    except Exception as e:
        logger.error(f"[Storage] Upload failed for {storage_path}: {e}")
        raise


def delete_file(storage_path: str) -> None:
    """Delete a file from Supabase Storage."""
    client = get_storage_client()
    try:
        client.storage.from_(settings.SUPABASE_BUCKET).remove([storage_path])
        logger.info(f"[Storage] Deleted: {storage_path}")
    except Exception as e:
        logger.warning(f"[Storage] Delete failed for {storage_path}: {e}")


def get_file_url(storage_path: str) -> str:
    """Get a public/signed URL for a stored file."""
    client = get_storage_client()
    try:
        response = client.storage.from_(settings.SUPABASE_BUCKET).create_signed_url(
            storage_path, expires_in=3600
        )
        return response.get("signedURL", "")
    except Exception as e:
        logger.error(f"[Storage] URL generation failed: {e}")
        return ""
