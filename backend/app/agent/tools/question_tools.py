import json
import random
from pathlib import Path
from langchain_core.tools import tool

QUESTIONS_PATH = Path(__file__).parent.parent.parent / "data" / "questions" / "questions_v0.1.jsonl"


def _load_questions() -> list[dict]:
    questions = []
    with open(QUESTIONS_PATH, encoding="utf-8") as f:
        for line in f:
            if line.strip():
                questions.append(json.loads(line))
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
    }


def get_random_question(exclude_ids: list[str] | None = None) -> dict | None:
    """question_history를 제외한 랜덤 문제 반환. 전부 소진되면 None."""
    questions = _load_questions()
    exclude = set(exclude_ids or [])
    available = [q for q in questions if q["id"] not in exclude]
    if not available:
        return None
    return _to_question_dict(random.choice(available))


def get_question_by_id(question_id: str) -> dict | None:
    """id로 특정 문제 반환."""
    for q in _load_questions():
        if q["id"] == question_id:
            return _to_question_dict(q)
    return None


@tool
def generate_sqld_question() -> dict:
    """SQLD 문제를 랜덤으로 1개 반환한다."""
    result = get_random_question()
    return result or {}
