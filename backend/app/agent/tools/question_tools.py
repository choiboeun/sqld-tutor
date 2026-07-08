import json
import random
from pathlib import Path
from langchain_core.tools import tool

QUESTIONS_PATH = Path(__file__).parent.parent.parent / "data" / "questions" / "questions_v0.1.jsonl"

_QUESTIONS_CACHE: list[dict] | None = None


def _load_questions() -> list[dict]:
    global _QUESTIONS_CACHE
    if _QUESTIONS_CACHE is not None:
        return _QUESTIONS_CACHE
    questions = []
    with open(QUESTIONS_PATH, encoding="utf-8") as f:
        for line in f:
            if line.strip():
                questions.append(json.loads(line))
    _QUESTIONS_CACHE = questions
    return questions


def _to_question_dict(q: dict) -> dict:
    return {
        "id": q["id"],
        "category": q["category"],
        "difficulty": q["difficulty"],
        "context": q.get("context"),
        "question": q["question"],
        "options": q["options"],
        "answer": q["answer"],
        "explanation": q.get("explanation", ""),
        "tags": q.get("tags", []),
    }


def get_random_question(
    exclude_ids: list[str] | None = None,
    category: str | None = None,
    difficulty: str | None = None,
    avoid_category: str | None = None,
) -> dict | None:
    """조건에 맞는 랜덤 문제 반환. 전부 소진되면 None."""
    questions = _load_questions()
    exclude = set(exclude_ids or [])
    available = [q for q in questions if q["id"] not in exclude]
    if category:
        available = [q for q in available if q["category"] == category]
    if difficulty:
        available = [q for q in available if q["difficulty"] == difficulty]
    # 카테고리 전환 신호가 있을 때 직전 카테고리 제외 (대안이 없으면 무시)
    if avoid_category and not category:
        alt = [q for q in available if q["category"] != avoid_category]
        if alt:
            available = alt
    if not available:
        return None
    return _to_question_dict(random.choice(available))


def get_available_categories(exclude_ids: list[str] | None = None) -> list[str]:
    """아직 풀지 않은 문제가 남아 있는 카테고리 목록 반환."""
    questions = _load_questions()
    exclude = set(exclude_ids or [])
    return list({q["category"] for q in questions if q["id"] not in exclude})


def get_question_by_id(question_id: str) -> dict | None:
    """id로 특정 문제 반환."""
    for q in _load_questions():
        if q["id"] == question_id:
            return _to_question_dict(q)
    return None


@tool
def generate_sqld_question(category: str = "", difficulty: str = "") -> dict:
    """SQLD 문제를 1개 반환한다.
    category: 카테고리명 (예: '조인', 'SELECT & WHERE'). 빈 문자열이면 전체.
    difficulty: 난이도 ('상', '중', '하'). 빈 문자열이면 전체.
    """
    result = get_random_question(
        category=category or None,
        difficulty=difficulty or None,
    )
    return result or {}
