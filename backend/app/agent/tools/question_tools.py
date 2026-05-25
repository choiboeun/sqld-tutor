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


@tool
def generate_sqld_question() -> dict:
    """SQLD 문제를 랜덤으로 1개 반환한다."""
    questions = _load_questions()
    question = random.choice(questions)
    return {
        "id": question["id"],
        "category": question["category"],
        "difficulty": question["difficulty"],
        "context": question.get("context"),  # SQL, ERD 등 문제에 필요한 자료
        "question": question["question"],
        "options": question["options"],
        "answer": question["answer"],
    }
