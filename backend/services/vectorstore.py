import logging
import uuid
from typing import Dict, List, Optional

from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

from config import settings
from services.embedding import EMBEDDING_DIM

logger = logging.getLogger(__name__)

_client: Optional[QdrantClient] = None


def get_client() -> QdrantClient:
    global _client
    if _client is None:
        _client = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY,
            port=443,
            prefer_grpc=False,
            timeout=30,
        )
        logger.info("Qdrant client connected")
    return _client


def ensure_collections() -> None:
    """Create Qdrant collections and payload indexes if they don't exist. Called on startup."""
    client = get_client()

    for col_name in [settings.QDRANT_COLLECTION, settings.QDRANT_QA_COLLECTION]:
        existing = [c.name for c in client.get_collections().collections]
        if col_name not in existing:
            client.create_collection(
                collection_name=col_name,
                vectors_config=qmodels.VectorParams(
                    size=EMBEDDING_DIM,
                    distance=qmodels.Distance.COSINE,
                ),
            )
            logger.info(f"Created Qdrant collection: {col_name}")
        else:
            logger.info(f"Qdrant collection exists: {col_name}")


        for field, schema in [
            ("doc_id", qmodels.PayloadSchemaType.KEYWORD),
            ("department", qmodels.PayloadSchemaType.KEYWORD),
        ]:
            try:
                client.create_payload_index(
                    collection_name=col_name,
                    field_name=field,
                    field_schema=schema,
                )
                logger.info(f"Payload index ensured: {col_name}.{field}")
            except Exception:
                pass


def _build_filter(
    department: Optional[str],
    doc_ids: Optional[List[str]],
    is_admin: bool,
) -> Optional[qmodels.Filter]:
    must: List[qmodels.Condition] = []


    if not is_admin and department:
        must.append(
            qmodels.FieldCondition(
                key="department",
                match=qmodels.MatchAny(any=[department, "global"]),
            )
        )


    if doc_ids:
        must.append(
            qmodels.FieldCondition(
                key="doc_id",
                match=qmodels.MatchAny(any=doc_ids),
            )
        )

    return qmodels.Filter(must=must) if must else None


def upsert_chunks(
    doc_id: str,
    chunks: List[Dict],
    embeddings: List[List[float]],
    collection: str = None,
) -> None:
    """Upsert document chunks with their embeddings into Qdrant."""
    collection = collection or settings.QDRANT_COLLECTION
    client = get_client()

    points = []
    for i, (chunk, vector) in enumerate(zip(chunks, embeddings)):
        meta = chunk.get("metadata", {})

        point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{doc_id}_{i}"))
        points.append(
            qmodels.PointStruct(
                id=point_id,
                vector=vector,
                payload={
                    "doc_id": doc_id,
                    "filename": meta.get("filename", ""),
                    "department": meta.get("department", "global"),
                    "is_global": meta.get("is_global", False),
                    "page": meta.get("page", 1),
                    "chunk_index": meta.get("chunk_index", i),
                    "text": chunk.get("text", ""),
                },
            )
        )

    if points:
        client.upsert(collection_name=collection, points=points)
        logger.info(f"[Qdrant] Upserted {len(points)} chunks for doc_id={doc_id}")


def delete_doc_chunks(doc_id: str, collection: str = None) -> None:
    """Delete all vectors for a given doc_id."""
    collection = collection or settings.QDRANT_COLLECTION
    client = get_client()
    client.delete(
        collection_name=collection,
        points_selector=qmodels.FilterSelector(
            filter=qmodels.Filter(
                must=[qmodels.FieldCondition(key="doc_id", match=qmodels.MatchValue(value=doc_id))]
            )
        ),
    )
    logger.info(f"[Qdrant] Deleted chunks for doc_id={doc_id}")


def query_chunks(
    query_embedding: List[float],
    n_results: int = 10,
    department: Optional[str] = None,
    doc_ids: Optional[List[str]] = None,
    is_admin: bool = False,
) -> List[Dict]:
    """Semantic search in Qdrant. Returns list of {text, metadata, score}."""
    client = get_client()
    q_filter = _build_filter(department, doc_ids, is_admin)

    try:
        results = client.search(
            collection_name=settings.QDRANT_COLLECTION,
            query_vector=query_embedding,
            limit=n_results,
            query_filter=q_filter,
            with_payload=True,
        )
        return [
            {
                "text": r.payload.get("text", ""),
                "metadata": {k: v for k, v in r.payload.items() if k != "text"},
                "score": r.score,
            }
            for r in results
            if r.score >= settings.SCORE_THRESHOLD
        ]
    except Exception as e:
        logger.error(f"[Qdrant] query_chunks error: {e}")
        return []


def query_verified_qa(query_embedding: List[float], threshold: float = 0.85) -> Optional[str]:
    """Check verified QA collection for a high-confidence match. Returns QA id or None."""
    client = get_client()
    try:
        results = client.search(
            collection_name=settings.QDRANT_QA_COLLECTION,
            query_vector=query_embedding,
            limit=1,
            with_payload=True,
        )
        if results and results[0].score >= threshold:
            return results[0].payload.get("qa_id")
    except Exception as e:
        logger.error(f"[Qdrant] verified_qa query error: {e}")
    return None


def upsert_verified_qa(qa_id: str, embedding: List[float], question: str, department: str) -> None:
    client = get_client()
    client.upsert(
        collection_name=settings.QDRANT_QA_COLLECTION,
        points=[
            qmodels.PointStruct(
                id=qa_id,
                vector=embedding,
                payload={"qa_id": qa_id, "question": question, "department": department},
            )
        ],
    )


def delete_verified_qa(qa_id: str) -> None:
    client = get_client()
    client.delete(
        collection_name=settings.QDRANT_QA_COLLECTION,
        points_selector=qmodels.PointIdsList(points=[qa_id]),
    )


def get_collection_stats() -> Dict:
    client = get_client()
    try:
        info = client.get_collection(settings.QDRANT_COLLECTION)
        return {
            "total_chunks": info.points_count,
            "collection_name": settings.QDRANT_COLLECTION,
        }
    except Exception as e:
        logger.error(f"[Qdrant] stats error: {e}")
        return {"total_chunks": 0, "collection_name": settings.QDRANT_COLLECTION}
