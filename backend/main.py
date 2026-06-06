import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import init_db
from services.vectorstore import ensure_collections
from routers import auth, ingest, documents, query, conversations, compare, feeds, admin

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

API_V1 = "/api/v1"


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 AuditFlow v%s starting...", settings.APP_VERSION)

    await init_db()
    ensure_collections()
    logger.info("✅ All systems ready")
    yield
    logger.info("🛑 AuditFlow shutting down")


app = FastAPI(
    title="AuditFlow API",
    version=settings.APP_VERSION,
    description="Enterprise compliance intelligence — RAG + Gap Analysis + Regulatory Feeds",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    debug=settings.DEBUG,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,          prefix=API_V1)
app.include_router(ingest.router,        prefix=API_V1)
app.include_router(documents.router,     prefix=API_V1)
app.include_router(query.router,         prefix=API_V1)
app.include_router(conversations.router, prefix=API_V1)
app.include_router(compare.router,       prefix=API_V1)
app.include_router(feeds.router,         prefix=API_V1)
app.include_router(admin.router,         prefix=API_V1)


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "version": settings.APP_VERSION, "environment": settings.ENVIRONMENT}


@app.get("/", tags=["Root"])
async def root():
    return {"name": settings.APP_NAME, "version": settings.APP_VERSION, "docs": "/docs"}
