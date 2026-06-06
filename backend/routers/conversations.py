import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from database import get_db
from models.schemas import ConversationDetail, ConversationSchema, MessageSchema, SuccessResponse
from services.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/conversations", tags=["Conversations"])


def _to_msg(row: dict) -> MessageSchema:
    sources = row.get("sources")
    if isinstance(sources, list):
        from models.schemas import SourceChunk
        sources = [SourceChunk(**s) for s in sources] if sources else []
    return MessageSchema(
        id=row["id"], role=row["role"], content=row["content"],
        sources=sources or [], created_at=row["created_at"],
    )


@router.get("", response_model=list[ConversationSchema])
async def list_conversations(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    result = db.table("conversations").select("*").eq(
        "user_id", current_user["id"]
    ).order("updated_at", desc=True).execute()

    output = []
    for conv in result.data:
        msg_count = db.table("messages").select("id", count="exact").eq(
            "conversation_id", conv["id"]
        ).execute().count or 0
        output.append(ConversationSchema(
            id=conv["id"], title=conv.get("title"),
            created_at=conv["created_at"], updated_at=conv["updated_at"],
            message_count=msg_count,
        ))
    return output


@router.get("/{conv_id}", response_model=ConversationDetail)
async def get_conversation(
    conv_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    result = db.table("conversations").select("*").eq("id", conv_id).eq(
        "user_id", current_user["id"]
    ).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Conversation not found")
    conv = result.data[0]

    msgs_result = db.table("messages").select("*").eq(
        "conversation_id", conv_id
    ).order("created_at").execute()
    messages = [_to_msg(m) for m in msgs_result.data]

    return ConversationDetail(
        id=conv["id"], title=conv.get("title"),
        created_at=conv["created_at"], updated_at=conv["updated_at"],
        messages=messages,
    )


@router.delete("/{conv_id}", response_model=SuccessResponse)
async def delete_conversation(
    conv_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    result = db.table("conversations").select("id").eq("id", conv_id).eq(
        "user_id", current_user["id"]
    ).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.table("messages").delete().eq("conversation_id", conv_id).execute()
    db.table("conversations").delete().eq("id", conv_id).execute()
    return SuccessResponse(message="Conversation deleted")


@router.get("/{conv_id}/messages", response_model=list[MessageSchema])
async def get_messages(
    conv_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Return just the messages for a conversation (frontend convenience endpoint)."""
    result = db.table("conversations").select("id").eq("id", conv_id).eq(
        "user_id", current_user["id"]
    ).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Conversation not found")

    msgs = db.table("messages").select("*").eq(
        "conversation_id", conv_id
    ).order("created_at").execute()
    return [_to_msg(m) for m in msgs.data]




@router.delete("", response_model=SuccessResponse)
async def clear_all_conversations(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    convs = db.table("conversations").select("id").eq(
        "user_id", current_user["id"]
    ).execute()
    count = len(convs.data)
    for conv in convs.data:
        db.table("messages").delete().eq("conversation_id", conv["id"]).execute()
    db.table("conversations").delete().eq("user_id", current_user["id"]).execute()
    return SuccessResponse(message=f"Cleared {count} conversation(s)")
