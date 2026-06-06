import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client

from database import get_db
from models.schemas import (
    CreateFeedRequest, FeedItem, ImpactAnalysisResponse,
    ReviewFeedRequest, SuccessResponse,
)
from services.auth import get_current_user, require_admin
from services.generation import generate_impact_analysis

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/feeds", tags=["Regulatory Feeds"])


def _severity(row: dict) -> str:
    """Derive severity string from is_critical flag or explicit severity column."""
    if row.get("severity"):
        return row["severity"]
    return "high" if row.get("is_critical") else "medium"


def _to_feed(row: dict, bookmarked=False, reviewed=False, review_notes=None) -> FeedItem:
    return FeedItem(
        id=row["id"],
        title=row["title"],
        summary=row.get("summary"),
        content=row.get("content"),
        source=row["source"],
        source_short=row.get("source_short") or row["source"],   # authority short name
        category=row.get("category"),
        url=row.get("url"),
        published_at=row.get("published_at"),
        is_critical=row.get("is_critical", False),
        severity=_severity(row),
        department_tags=row.get("department_tags"),
        ai_impact=row.get("ai_impact"),
        created_at=row["created_at"],
        is_read=False,                  # tracked client-side only
        is_bookmarked=bookmarked,
        is_reviewed=reviewed,
        review_notes=review_notes,
    )


@router.get("", response_model=list[FeedItem])
async def list_feeds(
    source: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    is_critical: Optional[bool] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    q = db.table("regulatory_feeds").select("*")
    if source:
        q = q.eq("source", source)
    if category:
        q = q.eq("category", category)
    if is_critical is not None:
        q = q.eq("is_critical", is_critical)
    if search:
        q = q.ilike("title", f"%{search}%")

    result = q.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    feeds = result.data or []
    feed_ids = [f["id"] for f in feeds]

    # Get user actions for this user
    bookmarked = set()
    reviewed = set()
    notes_map: dict = {}  # feed_id -> notes
    if feed_ids:
        actions = db.table("feed_user_actions").select("feed_id,action,notes").eq(
            "user_id", current_user["id"]
        ).in_("feed_id", feed_ids).execute().data or []
        for a in actions:
            if a["action"] == "bookmarked":
                bookmarked.add(a["feed_id"])
            elif a["action"] == "reviewed":
                reviewed.add(a["feed_id"])
                notes_map[a["feed_id"]] = a.get("notes")

    return [
        _to_feed(f, f["id"] in bookmarked, f["id"] in reviewed, notes_map.get(f["id"]))
        for f in feeds
    ]


@router.get("/{feed_id}", response_model=FeedItem)
async def get_feed(
    feed_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    result = db.table("regulatory_feeds").select("*").eq("id", feed_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Feed not found")
    row = result.data[0]
    # Get user actions for this feed
    actions = db.table("feed_user_actions").select("action,notes").eq(
        "user_id", current_user["id"]
    ).eq("feed_id", feed_id).execute().data or []
    bookmarked = any(a["action"] == "bookmarked" for a in actions)
    reviewed = any(a["action"] == "reviewed" for a in actions)
    notes = next((a.get("notes") for a in actions if a["action"] == "reviewed"), None)
    return _to_feed(row, bookmarked, reviewed, notes)


@router.post("/admin", response_model=FeedItem, status_code=201)
async def create_feed(
    payload: CreateFeedRequest,
    admin: dict = Depends(require_admin),
    db: Client = Depends(get_db),
):
    now = datetime.now(timezone.utc).isoformat()
    data = payload.model_dump()

    # Derive is_critical from severity if provided
    if data.get("severity") in ("high", "critical"):
        data["is_critical"] = True
    elif data.get("severity") in ("low", "medium"):
        data["is_critical"] = False

    # Only columns that exist in the DB table
    DB_COLUMNS = {"title", "summary", "content", "source", "source_short",
                  "category", "url", "published_at", "is_critical",
                  "severity", "department_tags"}
    row = {k: v for k, v in data.items() if k in DB_COLUMNS and v is not None}
    row["id"] = str(uuid.uuid4())
    row["created_at"] = now
    # Ensure source_short defaults to source
    row.setdefault("source_short", row["source"])
    if row.get("published_at") and hasattr(row["published_at"], "isoformat"):
        row["published_at"] = row["published_at"].isoformat()

    result = db.table("regulatory_feeds").insert(row).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create feed")
    return _to_feed(result.data[0])


@router.delete("/{feed_id}", response_model=SuccessResponse)
async def delete_feed(
    feed_id: str,
    admin: dict = Depends(require_admin),
    db: Client = Depends(get_db),
):
    r = db.table("regulatory_feeds").select("id").eq("id", feed_id).execute()
    if not r.data:
        raise HTTPException(status_code=404, detail="Feed not found")
    db.table("feed_user_actions").delete().eq("feed_id", feed_id).execute()
    db.table("regulatory_feeds").delete().eq("id", feed_id).execute()
    return SuccessResponse(message="Feed deleted")


@router.post("/{feed_id}/bookmark", response_model=SuccessResponse)
async def toggle_bookmark(
    feed_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    existing = db.table("feed_user_actions").select("id").eq("feed_id", feed_id).eq(
        "user_id", current_user["id"]
    ).eq("action", "bookmarked").execute()
    if existing.data:
        db.table("feed_user_actions").delete().eq("id", existing.data[0]["id"]).execute()
        return SuccessResponse(message="Bookmark removed", success=False)
    else:
        db.table("feed_user_actions").insert({
            "id": str(uuid.uuid4()), "feed_id": feed_id,
            "user_id": current_user["id"], "action": "bookmarked",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
        return SuccessResponse(message="Bookmarked")


@router.post("/{feed_id}/review", response_model=SuccessResponse)
async def mark_reviewed(
    feed_id: str,
    payload: ReviewFeedRequest,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    existing = db.table("feed_user_actions").select("id").eq("feed_id", feed_id).eq(
        "user_id", current_user["id"]
    ).eq("action", "reviewed").execute()
    now = datetime.now(timezone.utc).isoformat()
    if not existing.data:
        db.table("feed_user_actions").insert({
            "id": str(uuid.uuid4()), "feed_id": feed_id,
            "user_id": current_user["id"], "action": "reviewed",
            "notes": payload.notes, "created_at": now,
        }).execute()
    else:
        db.table("feed_user_actions").update({"notes": payload.notes}).eq(
            "id", existing.data[0]["id"]
        ).execute()
    return SuccessResponse(message="Marked as reviewed")


@router.get("/{feed_id}/impact", response_model=ImpactAnalysisResponse)
async def get_impact_analysis(
    feed_id: str,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    result = db.table("regulatory_feeds").select("*").eq("id", feed_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Feed not found")
    feed = result.data[0]

    # Return cached full-JSON analysis if available
    cached = feed.get("ai_impact")
    if cached:
        import json
        try:
            # Try to parse as full JSON first (new format)
            data = json.loads(cached) if cached.startswith("{") else None
            if data and "impact_summary" in data:
                return ImpactAnalysisResponse(
                    impact_summary=data["impact_summary"],
                    affected_departments=data.get("affected_departments", ["Compliance"]),
                    action_items=data.get("action_items", ["Review the regulatory update"]),
                    urgency=data.get("urgency", "medium"),
                )
        except Exception:
            pass
        # Legacy: cached was just the summary string — regenerate to get full data

    # Generate fresh analysis via Gemini
    analysis = generate_impact_analysis(
        feed_title=feed["title"],
        feed_content=feed.get("content") or feed.get("summary") or "",
    )

    # Cache the FULL JSON in DB so repeat loads are instant with all fields
    import json
    try:
        db.table("regulatory_feeds").update({
            "ai_impact": json.dumps(analysis)
        }).eq("id", feed_id).execute()
    except Exception as e:
        logger.warning(f"Failed to cache ai_impact: {e}")

    return ImpactAnalysisResponse(**analysis)
