"""
AuditFlow Database Client — Supabase PostgreSQL via REST API (HTTPS port 443)

Since direct asyncpg TCP connections (ports 5432/6543) can be blocked by ISPs,
this client uses Supabase's Python SDK which communicates over HTTPS (port 443).

All database operations go through: supabase.table("name").select/insert/update/delete
"""
import logging
from typing import Optional

from supabase import create_client, Client
from config import settings

logger = logging.getLogger(__name__)

_client: Optional[Client] = None


def get_db_client() -> Client:
    """Get the Supabase client (singleton)."""
    global _client
    if _client is None:
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        logger.info("✅ Supabase client ready (REST over HTTPS)")
    return _client


def get_db() -> Client:
    """FastAPI dependency — returns the Supabase client directly."""
    return get_db_client()


async def init_db() -> None:
    """Verify DB connectivity and ensure tables exist."""
    try:
        sb = get_db_client()

        sb.table("users").select("id").limit(1).execute()
        logger.info("✅ Database connected via Supabase REST")
    except Exception as e:

        logger.warning(
            f"Database check: {e}\n"
            "→ Run database/migrations/001_initial.sql in Supabase SQL Editor to create tables."
        )
