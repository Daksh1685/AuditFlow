import logging
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from typing import Optional

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from supabase import Client

from config import settings
from database import get_db

logger = logging.getLogger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)


_user_cache: dict[str, tuple[dict, float]] = {}
_CACHE_TTL = 300


def _cache_get(user_id: str) -> Optional[dict]:
    entry = _user_cache.get(user_id)
    if entry:
        user, expiry = entry
        import time
        if time.monotonic() < expiry:
            return user
        del _user_cache[user_id]
    return None


def _cache_set(user_id: str, user: dict) -> None:
    import time
    _user_cache[user_id] = (user, time.monotonic() + _CACHE_TTL)


def cache_invalidate(user_id: str) -> None:
    """Call this when a user's data changes (role update, deactivation etc.)"""
    _user_cache.pop(user_id, None)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Client = Depends(get_db),
) -> dict:
    """
    Returns the current user dict.
    Uses an in-process cache (5 min TTL) to avoid a Supabase round-trip
    on every authenticated request — dramatically reduces page load times.
    """
    if not credentials:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    payload = decode_token(credentials.credentials)
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")

    user_id: str = payload.get("sub", "")


    cached = _cache_get(user_id)
    if cached:
        if not cached.get("is_active"):
            raise HTTPException(status_code=401, detail="Account is deactivated")
        return cached


    result = db.table("users").select("*").eq("id", user_id).eq("is_active", True).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    user = result.data[0]
    _cache_set(user_id, user)
    return user


async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
