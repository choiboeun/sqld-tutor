import json
import random
from pathlib import Path
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.auth import get_current_user_id

router = APIRouter()

# 실제 SQLD 시험 카테고리별 출제 수 (합계 50문제)
EXAM_COUNTS: dict[str, int] = {
    "데이터 모델링 기초":    6,
    "데이터 모델과 SQL":     4,
    "SELECT & WHERE":       5,
    "함수":                  5,
    "GROUP BY & ORDER BY":  4,
    "조인":                  5,
    "서브쿼리 & Top N":      4,
    "집합 연산자 & 그룹 함수": 4,
    "윈도우 함수":           4,
    "SQL 활용 기타":         5,
    "관리 구문":             4,
}

# 출제 수별 하/중/상 고정 배분 (매 시험 일관된 난이도 분포 보장)
# 4문제: 하1+중2+상1  5문제: 하1+중3+상1  6문제: 하2+중3+상1
# 전체 합산: 하12(24%) + 중27(54%) + 상11(22%)
DIFF_PLAN: dict[int, dict[str, int]] = {
    4: {"하": 1, "중": 2, "상": 1},
    5: {"하": 1, "중": 3, "상": 1},
    6: {"하": 2, "중": 3, "상": 1},
}

SUBJECT1_CATS = {"데이터 모델링 기초", "데이터 모델과 SQL"}

_QUESTIONS: list[dict] | None = None
_QUESTIONS_INDEX: dict[str, dict] | None = None
_QUESTIONS_MTIME: float = 0.0

_QUESTIONS_PATH = Path(__file__).parent.parent / "data" / "questions" / "questions_v0.1.jsonl"


def _load_questions() -> list[dict]:
    global _QUESTIONS, _QUESTIONS_INDEX, _QUESTIONS_MTIME
    try:
        mtime = _QUESTIONS_PATH.stat().st_mtime
    except FileNotFoundError as exc:
        raise RuntimeError(f"문제 파일을 찾을 수 없습니다: {_QUESTIONS_PATH}") from exc
    if _QUESTIONS is None or mtime != _QUESTIONS_MTIME:
        with open(_QUESTIONS_PATH) as f:
            _QUESTIONS = [json.loads(line) for line in f if line.strip()]
        _QUESTIONS_INDEX = {q["id"]: q for q in _QUESTIONS}
        _QUESTIONS_MTIME = mtime
    return _QUESTIONS


def _sample_by_difficulty(pool: list[dict], plan: dict[str, int]) -> list[dict]:
    """pool에서 난이도별 계획만큼 샘플링. 부족하면 다른 난이도로 채움."""
    by_diff: dict[str, list[dict]] = {"하": [], "중": [], "상": []}
    for q in pool:
        d = q.get("difficulty", "중")
        if d in by_diff:
            by_diff[d].append(q)

    result: list[dict] = []
    shortfall = 0

    for diff, count in plan.items():
        available = by_diff[diff]
        take = min(count, len(available))
        result.extend(random.sample(available, take))
        shortfall += count - take  # 부족한 수 누적

    # 부족분: 아직 안 뽑힌 문제 중 랜덤으로 채움
    if shortfall > 0:
        used_ids = {q["id"] for q in result}
        rest = [q for q in pool if q["id"] not in used_ids]
        result.extend(random.sample(rest, min(shortfall, len(rest))))

    return result


@router.get("/exam/generate")
async def generate_exam(user_id: str = Depends(get_current_user_id)):
    all_qs = _load_questions()

    by_cat: dict[str, list[dict]] = {}
    for q in all_qs:
        by_cat.setdefault(q["category"], []).append(q)

    subject1: list[dict] = []
    subject2: list[dict] = []

    for cat, count in EXAM_COUNTS.items():
        pool = by_cat.get(cat, [])
        plan = DIFF_PLAN.get(count, {"하": 1, "중": count - 2, "상": 1})
        picked = _sample_by_difficulty(pool, plan)

        if cat in SUBJECT1_CATS:
            subject1.extend(picked)
        else:
            subject2.extend(picked)

    # 과목 내 순서 셔플 후 1과목→2과목 순서로 합침 (실제 시험 순서)
    random.shuffle(subject1)
    random.shuffle(subject2)
    ordered = subject1 + subject2

    return {
        "questions": [
            {
                "id": q["id"],
                "num": i + 1,
                "subject": 1 if q["category"] in SUBJECT1_CATS else 2,
                "category": q["category"],
                "difficulty": q.get("difficulty", "중"),
                "question": q["question"],
                "context": q.get("context") or "",
                "image": q.get("image") or "",
                "options": q["options"],
            }
            for i, q in enumerate(ordered)
        ]
    }


class GradeRequest(BaseModel):
    answers: dict[str, int | None]  # question_id → 선택 보기 (1~4), None = 미답변


@router.post("/exam/grade")
async def grade_exam(body: GradeRequest, user_id: str = Depends(get_current_user_id)):
    _load_questions()
    results = []
    for qid, selected in body.answers.items():
        q = (_QUESTIONS_INDEX or {}).get(qid)
        if not q:
            continue
        correct_answer = q["answer"]
        results.append({
            "id": qid,
            "answer": correct_answer,
            "explanation": q.get("explanation") or "",
            "correct": selected == correct_answer if selected is not None else False,
        })
    return {"results": results}
