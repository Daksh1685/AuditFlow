import logging
import time
from typing import List

import google.generativeai as genai

from config import settings

logger = logging.getLogger(__name__)

genai.configure(api_key=settings.GEMINI_API_KEY)

EMBEDDING_DIM = 3072
_BATCH_SIZE = 100


def embed_texts(texts: List[str]) -> List[List[float]]:
    """Embed a list of texts using gemini-embedding-001. Returns list of 3072-dim vectors."""
    if not texts:
        return []

    all_embeddings: List[List[float]] = []

    for i in range(0, len(texts), _BATCH_SIZE):
        batch = texts[i : i + _BATCH_SIZE]
        try:
            if len(batch) == 1:
                result = genai.embed_content(
                    model=f"models/{settings.GEMINI_EMBEDDING_MODEL}",
                    content=batch[0],
                    task_type="retrieval_document",
                )
                all_embeddings.append(result["embedding"])
            else:
                for text in batch:
                    result = genai.embed_content(
                        model=f"models/{settings.GEMINI_EMBEDDING_MODEL}",
                        content=text,
                        task_type="retrieval_document",
                    )
                    all_embeddings.append(result["embedding"])
        except Exception as e:
            logger.error(f"Embedding batch {i//_BATCH_SIZE} failed: {e}")
            all_embeddings.extend([[0.0] * EMBEDDING_DIM] * len(batch))

    return all_embeddings


def embed_query(query: str) -> List[float]:
    """Embed a single query string for retrieval."""
    try:
        result = genai.embed_content(
            model=f"models/{settings.GEMINI_EMBEDDING_MODEL}",
            content=query,
            task_type="retrieval_query",
        )
        return result["embedding"]
    except Exception as e:
        logger.error(f"Query embedding failed: {e}")
        return [0.0] * EMBEDDING_DIM
