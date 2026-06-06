from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None
    department: Optional[str] = "global"


class LoginRequest(BaseModel):
    username: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class UserInfo(BaseModel):
    id: str
    username: str
    email: str
    full_name: Optional[str]
    role: str
    department: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserInfo


class UpdateMeRequest(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None


class UpdateRoleRequest(BaseModel):
    role: str
    department: Optional[str] = None


class DocumentInfo(BaseModel):
    id: str
    doc_id: str
    filename: str
    file_type: str
    file_size_bytes: int
    chunk_count: int
    page_count: int
    department: str
    is_global: bool
    description: Optional[str]
    tags: Optional[str]
    expires_at: Optional[datetime]
    version: int
    previous_version_id: Optional[str]
    upload_timestamp: datetime
    uploaded_by: Optional[str]

    model_config = {"from_attributes": True}


class DocumentStats(BaseModel):
    total_documents: int
    total_chunks: int
    collection_name: str


class IngestResponse(BaseModel):
    doc_id: str
    filename: str
    file_type: str
    total_chunks: int
    pages_processed: int
    status: str
    message: str


class UpdateMetadataRequest(BaseModel):
    description: Optional[str] = None
    tags: Optional[str] = None
    expires_at: Optional[datetime] = None
    department: Optional[str] = None
    is_global: Optional[bool] = None


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1)
    conversation_id: Optional[str] = None
    top_k: Optional[int] = 5
    include_sources: Optional[bool] = True
    doc_filter: Optional[List[str]] = None


class SourceChunk(BaseModel):
    text: str
    source_doc: str
    doc_id: str
    page: int
    chunk_index: int
    relevance_score: float


class QueryResponse(BaseModel):
    answer: str
    sources: List[SourceChunk]
    conversation_id: str
    message_id: str
    query: str
    model_used: str
    retrieval_time_ms: float
    generation_time_ms: float
    total_time_ms: float
    chunks_retrieved: int


class MessageSchema(BaseModel):
    id: str
    role: str
    content: str
    sources: Optional[List[SourceChunk]]
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationSchema(BaseModel):
    id: str
    title: Optional[str]
    created_at: datetime
    updated_at: datetime
    message_count: int

    model_config = {"from_attributes": True}


class ConversationDetail(BaseModel):
    id: str
    title: Optional[str]
    created_at: datetime
    updated_at: datetime
    messages: List[MessageSchema]

    model_config = {"from_attributes": True}


class GapItem(BaseModel):
    id: str
    new_rule: str
    internal_policy: str
    status: str
    explanation: str
    recommendation: str


class GapAnalysisResponse(BaseModel):
    filename: str
    gap_items: List[GapItem]
    total_findings: int
    conflicts_found: int
    missing_found: int


class FeedItem(BaseModel):
    id: str
    title: str
    summary: Optional[str]
    content: Optional[str]
    source: str
    source_short: str
    category: Optional[str]
    url: Optional[str]
    published_at: Optional[datetime]
    is_critical: bool
    severity: str
    department_tags: Optional[str] = None
    ai_impact: Optional[str] = None
    created_at: datetime
    is_read: bool = False
    is_bookmarked: bool = False
    is_reviewed: bool = False
    review_notes: Optional[str] = None

    model_config = {"from_attributes": True}


class CreateFeedRequest(BaseModel):
    title: str
    summary: Optional[str] = None
    content: Optional[str] = None
    source: str
    source_short: Optional[str] = None
    category: Optional[str] = None
    url: Optional[str] = None
    published_at: Optional[datetime] = None
    is_critical: bool = False
    severity: Optional[str] = None
    department_tags: Optional[str] = None


class ReviewFeedRequest(BaseModel):
    notes: Optional[str] = None


class ImpactAnalysisResponse(BaseModel):
    impact_summary: str
    affected_departments: List[str]
    action_items: List[str]
    urgency: str


class AuditLogSchema(BaseModel):
    id: str
    user_id: Optional[str]
    conversation_id: Optional[str]
    action: str
    query_text: Optional[str]
    status: str
    retrieval_time_ms: Optional[float]
    generation_time_ms: Optional[float]
    total_chunks_retrieved: Optional[int]
    ip_address: Optional[str]
    error_message: Optional[str]
    timestamp: datetime

    model_config = {"from_attributes": True}


class SystemStats(BaseModel):
    users: Dict[str, Any]
    documents: Dict[str, Any]
    conversations: Dict[str, Any]
    queries: Dict[str, Any]
    vector_store: Dict[str, Any]


class VerifiedQASchema(BaseModel):
    id: str
    question: str
    answer: str
    department: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CreateVerifiedQARequest(BaseModel):
    question: str
    answer: str
    department: str = "global"


class SuccessResponse(BaseModel):
    message: str
    success: bool = True
