from typing import Dict, List
from langchain_text_splitters import RecursiveCharacterTextSplitter
from config import settings


_splitter = RecursiveCharacterTextSplitter(
    chunk_size=settings.CHUNK_SIZE,
    chunk_overlap=settings.CHUNK_OVERLAP,
    length_function=len,
    separators=["\n\n", "\n", ". ", " ", ""],
)


def create_chunks(
    pages: List[Dict],
    doc_id: str,
    filename: str,
    department: str,
    is_global: bool = False,
) -> List[Dict]:
    """
    Split parsed pages into chunks.
    Returns list of {text, metadata} dicts.
    """
    effective_dept = "global" if is_global else department
    chunks = []
    chunk_idx = 0

    for page in pages:
        text = page.get("text", "").strip()
        if not text:
            continue

        splits = _splitter.split_text(text)
        for split in splits:
            split = split.strip()
            if not split:
                continue
            chunks.append({
                "text": split,
                "metadata": {
                    "doc_id": doc_id,
                    "filename": filename,
                    "department": effective_dept,
                    "is_global": is_global,
                    "page": page.get("page", 1),
                    "chunk_index": chunk_idx,
                },
            })
            chunk_idx += 1

    return chunks
