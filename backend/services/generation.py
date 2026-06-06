import logging
import time
from typing import List, Tuple

from groq import Groq

from config import settings

logger = logging.getLogger(__name__)

_GROUNDING_SYSTEM_PROMPT = """You are AuditFlow, a precision compliance intelligence assistant.

Your ONLY knowledge comes from the DOCUMENT EXCERPTS provided below.

Rules you must NEVER break:
1. Every factual claim MUST cite its source as: (Source: filename, Page N)
2. If the answer is not in the excerpts, respond EXACTLY with:
   "The provided documentation does not contain sufficient information to answer this question. Please consult the relevant regulatory authority or upload the specific document."
3. Never speculate, infer, or use outside knowledge.
4. Be concise, structured, and professional.
5. When listing items use numbered or bulleted lists.
"""


def generate_answer(
    query: str,
    chunks: List[dict],
    conversation_history: List[dict] = None,
) -> Tuple[str, float]:
    """
    Generate a grounded answer using Groq (Llama-3.3-70b).
    Returns (answer_text, generation_time_ms).
    """
    start = time.perf_counter()
    conversation_history = conversation_history or []

    if not chunks:
        return (
            "The provided documentation does not contain sufficient information to answer this question. "
            "Please upload the relevant compliance documents first.",
            0.0,
        )


    context_parts = []
    for i, chunk in enumerate(chunks[:settings.TOP_K_RESULTS], 1):
        meta = chunk.get("metadata", {})
        context_parts.append(
            f"[Excerpt {i} — {meta.get('filename', 'Unknown')}, Page {meta.get('page', '?')}]\n"
            f"{chunk.get('text', '')}"
        )
    context = "\n\n".join(context_parts)


    messages = [{"role": "system", "content": _GROUNDING_SYSTEM_PROMPT}]

    for turn in conversation_history[-settings.MAX_CONVERSATION_HISTORY:]:
        role = "assistant" if turn["role"] in ("assistant", "model") else "user"
        messages.append({"role": role, "content": turn["content"]})

    user_message = (
        f"DOCUMENT EXCERPTS:\n{context}\n\n"
        f"USER QUESTION: {query}\n\n"
        "Answer using ONLY the excerpts above. Cite every fact."
    )
    messages.append({"role": "user", "content": user_message})

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=messages,
            temperature=settings.GEMINI_TEMPERATURE,
            max_tokens=settings.GEMINI_MAX_OUTPUT_TOKENS,
        )
        answer = (response.choices[0].message.content or "").strip()

        answer = answer.replace('\x00', '').replace('\u0000', '')
    except Exception as e:
        logger.error(f"[Groq] Generation failed: {e}")
        answer = f"An error occurred while generating the answer. Please try again. (Error: {e})"


    elapsed_ms = (time.perf_counter() - start) * 1000
    return answer, round(elapsed_ms, 2)


def generate_impact_analysis(feed_title: str, feed_content: str) -> dict:
    """Generate impact analysis for a regulatory feed item using Groq."""
    prompt = f"""Analyze this regulatory update and provide a structured compliance impact assessment.

Title: {feed_title}
Content: {feed_content[:2000]}

Return ONLY a valid JSON object (no markdown, no explanation) with exactly these keys:
{{
  "impact_summary": "2-3 sentence summary of the compliance impact on Indian financial institutions",
  "affected_departments": ["list", "of", "departments"],
  "action_items": ["specific action 1", "specific action 2", "specific action 3"],
  "urgency": "high"
}}

The urgency must be one of: low, medium, high, critical."""

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are a compliance expert. Return only valid JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=600,
        )
        raw = response.choices[0].message.content.strip()

        import json, re

        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        json_match = re.search(r'\{[\s\S]*\}', raw)
        if json_match:
            return json.loads(json_match.group())
        return json.loads(raw)
    except Exception as e:
        logger.error(f"[Groq] Impact analysis failed: {e}")
        return {
            "impact_summary": f"Impact analysis for '{feed_title}': This regulatory update requires immediate review by compliance and legal teams.",
            "affected_departments": ["Compliance", "Legal", "Risk Management"],
            "action_items": [
                "Review the full regulatory circular from the issuing authority",
                "Assess impact on current policies and procedures",
                "Schedule compliance committee review within 30 days",
            ],
            "urgency": "medium",
        }
