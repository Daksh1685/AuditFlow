import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import (
    BigInteger, Boolean, DateTime, Float, ForeignKey,
    Integer, String, Text, UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.client import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id:               Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    username:         Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    email:            Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    full_name:        Mapped[Optional[str]] = mapped_column(String(255))
    hashed_password:  Mapped[str] = mapped_column(Text, nullable=False)
    role:             Mapped[str] = mapped_column(String(32), nullable=False, default="viewer")
    department:       Mapped[str] = mapped_column(String(64), nullable=False, default="global")
    is_active:        Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at:       Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    last_login:       Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    documents:        Mapped[List["Document"]] = relationship(back_populates="uploader")
    conversations:    Mapped[List["Conversation"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    audit_logs:       Mapped[List["AuditLog"]] = relationship(back_populates="user")
    feed_actions:     Mapped[List["FeedUserAction"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Document(Base):
    __tablename__ = "documents"

    id:                  Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    doc_id:              Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    filename:            Mapped[str] = mapped_column(String(512), nullable=False)
    file_hash:           Mapped[Optional[str]] = mapped_column(String(64), unique=True)
    file_type:           Mapped[str] = mapped_column(String(16), nullable=False)
    file_size_bytes:     Mapped[int] = mapped_column(BigInteger, default=0)
    storage_path:        Mapped[Optional[str]] = mapped_column(Text)
    chunk_count:         Mapped[int] = mapped_column(Integer, default=0)
    page_count:          Mapped[int] = mapped_column(Integer, default=0)
    department:          Mapped[str] = mapped_column(String(64), nullable=False, default="global")
    is_global:           Mapped[bool] = mapped_column(Boolean, default=False)
    description:         Mapped[Optional[str]] = mapped_column(Text)
    tags:                Mapped[Optional[str]] = mapped_column(Text)
    expires_at:          Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    version:             Mapped[int] = mapped_column(Integer, default=1)
    previous_version_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("documents.id"))
    uploaded_by:         Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"))
    upload_timestamp:    Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    uploader: Mapped[Optional["User"]] = relationship(back_populates="documents")


class Conversation(Base):
    __tablename__ = "conversations"

    id:         Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id:    Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title:      Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    user:     Mapped["User"] = relationship(back_populates="conversations")
    messages: Mapped[List["Message"]] = relationship(back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")


class Message(Base):
    __tablename__ = "messages"

    id:              Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    conversation_id: Mapped[str] = mapped_column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    role:            Mapped[str] = mapped_column(String(16), nullable=False)
    content:         Mapped[str] = mapped_column(Text, nullable=False)
    sources:         Mapped[Optional[dict]] = mapped_column(JSONB)
    created_at:      Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    conversation: Mapped["Conversation"] = relationship(back_populates="messages")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id:                    Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id:               Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"))
    conversation_id:       Mapped[Optional[str]] = mapped_column(String(36))
    action:                Mapped[str] = mapped_column(String(64), nullable=False)
    query_text:            Mapped[Optional[str]] = mapped_column(Text)
    answer_text:           Mapped[Optional[str]] = mapped_column(Text)
    sources_json:          Mapped[Optional[dict]] = mapped_column(JSONB)
    doc_ids_used:          Mapped[Optional[List[str]]] = mapped_column(ARRAY(Text))
    retrieval_time_ms:     Mapped[Optional[float]] = mapped_column(Float)
    generation_time_ms:    Mapped[Optional[float]] = mapped_column(Float)
    total_chunks_retrieved: Mapped[Optional[int]] = mapped_column(Integer)
    ip_address:            Mapped[Optional[str]] = mapped_column(String(64))
    user_agent:            Mapped[Optional[str]] = mapped_column(Text)
    status:                Mapped[str] = mapped_column(String(32), nullable=False, default="success")
    error_message:         Mapped[Optional[str]] = mapped_column(Text)
    timestamp:             Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, index=True)

    user: Mapped[Optional["User"]] = relationship(back_populates="audit_logs")


class VerifiedQA(Base):
    __tablename__ = "verified_qas"

    id:         Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    question:   Mapped[str] = mapped_column(Text, nullable=False)
    answer:     Mapped[str] = mapped_column(Text, nullable=False)
    department: Mapped[str] = mapped_column(String(64), nullable=False, default="global")
    created_by: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)


class RegulatoryFeed(Base):
    __tablename__ = "regulatory_feeds"

    id:           Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    title:        Mapped[str] = mapped_column(Text, nullable=False)
    summary:      Mapped[Optional[str]] = mapped_column(Text)
    content:      Mapped[Optional[str]] = mapped_column(Text)
    source:       Mapped[str] = mapped_column(String(128), nullable=False)
    category:     Mapped[Optional[str]] = mapped_column(String(128))
    url:          Mapped[Optional[str]] = mapped_column(Text)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    is_critical:  Mapped[bool] = mapped_column(Boolean, default=False)
    created_at:   Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    user_actions: Mapped[List["FeedUserAction"]] = relationship(back_populates="feed", cascade="all, delete-orphan")


class FeedUserAction(Base):
    __tablename__ = "feed_user_actions"
    __table_args__ = (UniqueConstraint("feed_id", "user_id", "action"),)

    id:         Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    feed_id:    Mapped[str] = mapped_column(String(36), ForeignKey("regulatory_feeds.id", ondelete="CASCADE"), nullable=False)
    user_id:    Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action:     Mapped[str] = mapped_column(String(32), nullable=False)
    notes:      Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    feed: Mapped["RegulatoryFeed"] = relationship(back_populates="user_actions")
    user: Mapped["User"] = relationship(back_populates="feed_actions")
