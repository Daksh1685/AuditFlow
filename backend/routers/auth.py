import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from database import get_db
from models.schemas import (
    LoginRequest, RegisterRequest, RefreshRequest,
    TokenResponse, UpdateMeRequest, UpdateRoleRequest, UserInfo, SuccessResponse,
)
from services.auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
    get_current_user, cache_invalidate,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Auth"])


def _to_user_info(row: dict) -> UserInfo:
    return UserInfo(
        id=row["id"], username=row["username"], email=row["email"],
        full_name=row.get("full_name"), role=row["role"],
        department=row["department"], is_active=row["is_active"],
        created_at=row["created_at"], last_login=row.get("last_login"),
    )


@router.post("/register", response_model=UserInfo, status_code=201)
async def register(payload: RegisterRequest, db: Client = Depends(get_db)):

    by_username = db.table("users").select("id").eq("username", payload.username).execute()
    by_email = db.table("users").select("id").eq("email", payload.email).execute()
    if by_username.data or by_email.data:
        raise HTTPException(status_code=409, detail="Username or email already taken")

    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    row = {
        "id": user_id,
        "username": payload.username,
        "email": payload.email,
        "full_name": payload.full_name,
        "hashed_password": hash_password(payload.password),
        "role": "viewer",
        "department": payload.department or "global",
        "is_active": True,
        "created_at": now,
    }
    result = db.table("users").insert(row).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create user")
    return _to_user_info(result.data[0])


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: Client = Depends(get_db)):
    result = db.table("users").select("*").eq("username", payload.username).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    user = result.data[0]
    if not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if not user["is_active"]:
        raise HTTPException(status_code=403, detail="Account is deactivated")


    now = datetime.now(timezone.utc).isoformat()
    db.table("users").update({"last_login": now}).eq("id", user["id"]).execute()
    user["last_login"] = now

    return TokenResponse(
        access_token=create_access_token(user["id"], user["role"]),
        refresh_token=create_refresh_token(user["id"]),
        expires_in=480 * 60,
        user=_to_user_info(user),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(payload: RefreshRequest, db: Client = Depends(get_db)):
    try:
        data = decode_token(payload.refresh_token)
    except HTTPException:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    if data.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    result = db.table("users").select("*").eq("id", data["sub"]).eq("is_active", True).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="User not found")
    user = result.data[0]

    return TokenResponse(
        access_token=create_access_token(user["id"], user["role"]),
        refresh_token=create_refresh_token(user["id"]),
        expires_in=480 * 60,
        user=_to_user_info(user),
    )


@router.get("/me", response_model=UserInfo)
async def get_me(current_user: dict = Depends(get_current_user)):
    return _to_user_info(current_user)


@router.put("/me", response_model=UserInfo)
async def update_me(
    payload: UpdateMeRequest,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    updates = {}
    if payload.full_name is not None:
        updates["full_name"] = payload.full_name
    if payload.department is not None:
        updates["department"] = payload.department

    if updates:
        result = db.table("users").update(updates).eq("id", current_user["id"]).execute()
        if result.data:
            return _to_user_info(result.data[0])
    return _to_user_info(current_user)


@router.get("/users", response_model=list[UserInfo])
async def list_users(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    result = db.table("users").select("*").order("created_at", desc=True).execute()
    return [_to_user_info(u) for u in result.data]


@router.put("/users/{user_id}/role", response_model=UserInfo)
async def update_user_role(
    user_id: str,
    payload: UpdateRoleRequest,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    updates = {"role": payload.role}
    if payload.department:
        updates["department"] = payload.department
    result = db.table("users").update(updates).eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    return _to_user_info(result.data[0])


@router.delete("/users/{user_id}", response_model=SuccessResponse)
async def deactivate_user(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
    result = db.table("users").update({"is_active": False}).eq("id", user_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    return SuccessResponse(message=f"User deactivated")
