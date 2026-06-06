import logging
import time
from typing import Dict, List, Optional, Tuple

from supabase import Client

from config import settings
from services.embedding import embed_query
from services.vectorstore import query_chunks

logger = logging.getLogger(__name__)


def _rrf_merge(semantic: List[Dict], keyword: List[Dict], k: int = 60) -> List[Dict]:
    """Reciprocal Rank Fusion merge."""
    scores: Dict[str, float] = {}
    lookup: Dict[str, Dict] = {}

    def key(chunk: Dict) -> str:
        m = chunk.get("metadata", {})
        return f"{m.get('doc_id','')}_{m.get('chunk_index', chunk.get('text','')[:50])}"

    for rank, chunk in enumerate(semantic):
        k_ = key(chunk)
        scores[k_] = scores.get(k_, 0.0) + 1.0 / (k + rank + 1)
        lookup[k_] = chunk

    for rank, chunk in enumerate(keyword):
        k_ = key(chunk)
        scores[k_] = scores.get(k_, 0.0) + 1.0 / (k + rank + 1)
        lookup[k_] = chunk

    return [lookup[k_] for k_ in sorted(scores, key=lambda x: scores[x], reverse=True)]


async def retrieve(
    query: str,
    top_k: Optional[int] = None,
    department: Optional[str] = None,
    doc_ids: Optional[List[str]] = None,
    is_admin: bool = False,
    db: Optional[Client] = None,
) -> Tuple[List[Dict], float]:
    """Hybrid retrieval: Qdrant semantic + Supabase keyword search, merged via RRF."""
    top_k = top_k or settings.TOP_K_RESULTS
    start = time.perf_counter()


    query_emb = embed_query(query)
    semantic = query_chunks(
        query_embedding=query_emb,
        n_results=max(top_k * 3, 15),
        department=department,
        doc_ids=doc_ids,
        is_admin=is_admin,
    )


    keyword: List[Dict] = []
    if db is not None:
        try:
            words = [w.strip() for w in query.split() if len(w.strip()) > 2][:5]
            if words:
                main_word = words[0]
                q = db.table("document_chunks").select(
                    "doc_id, chunk_index, content, page_num"
                ).ilike("content", f"%{main_word}%").limit(30)


                if doc_ids:

                    q = q.in_("doc_id", doc_ids)
                elif not is_admin and department:

                    allowed_docs = db.table("documents").select("doc_id").or_(
                        f"department.eq.{department},is_global.eq.true,department.eq.global"
                    ).execute().data or []
                    allowed_ids = [d["doc_id"] for d in allowed_docs]
                    if allowed_ids:
                        q = q.in_("doc_id", allowed_ids)
                    else:
                        q = q.eq("doc_id", "__no_docs__")

                result = q.execute()
                rows = result.data or []


                doc_id_set = {r["doc_id"] for r in rows}
                if doc_id_set:
                    docs_meta = db.table("documents").select("doc_id,filename,department,is_global").in_(
                        "doc_id", list(doc_id_set)
                    ).execute().data or []
                    meta_map = {d["doc_id"]: d for d in docs_meta}
                else:
                    meta_map = {}

                for row in rows:
                    meta = meta_map.get(row["doc_id"], {})
                    keyword.append({
                        "text": row["content"],
                        "metadata": {
                            "doc_id": row["doc_id"],
                            "filename": meta.get("filename", "Unknown"),
                            "department": meta.get("department", "global"),
                            "is_global": meta.get("is_global", False),
                            "page": row["page_num"],
                            "chunk_index": row["chunk_index"],
                        },
                        "score": 0.5,
                    })
        except Exception as e:
            logger.warning(f"[Retrieval] Keyword search failed: {e}")


    merged = _rrf_merge(semantic, keyword)
    final = merged[:top_k]

    elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
    logger.info(f"[Retrieval] sem={len(semantic)} kw={len(keyword)} merged→{len(final)} ({elapsed_ms}ms)")
    return final, elapsed_ms
