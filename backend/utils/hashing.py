import hashlib


def sha256_hash(data: bytes) -> str:
    """Compute SHA-256 hex digest of file bytes for deduplication."""
    return hashlib.sha256(data).hexdigest()
