from fastapi import APIRouter
from app.agent.graph import graph

router = APIRouter()

_CATEGORIES = [
    "데이터 모델링 기초", "데이터 모델과 SQL", "SELECT & WHERE",
    "함수", "GROUP BY & ORDER BY", "조인",
    "서브쿼리 & Top N", "집합 연산자 & 그룹 함수",
    "윈도우 함수", "SQL 활용 기타", "관리 구문",
]


@router.get("/progress/{thread_id}")
async def get_progress(thread_id: str):
    config = {"configurable": {"thread_id": thread_id}}
    state = await graph.aget_state(config)

    if not state.values:
        return {
            "total_answered": 0,
            "streak": 0,
            "accuracy_by_category": {
                cat: {"accuracy": 0.0, "attempts": 0} for cat in _CATEGORIES
            },
            "weak_categories": [],
            "wrong_count": 0,
        }

    v = state.values
    accuracy = v.get("accuracy_by_category") or {}
    attempts = v.get("attempts_by_category") or {}

    weak = [
        {"category": cat, "accuracy": accuracy.get(cat, 0.0)}
        for cat in _CATEGORIES
        if attempts.get(cat, 0) >= 1 and accuracy.get(cat, 0.0) < 0.6
    ]
    weak.sort(key=lambda x: x["accuracy"])

    wrong_log = v.get("wrong_answer_log") or {}

    return {
        "total_answered": v.get("total_answered", 0),
        "streak": v.get("streak", 0),
        "accuracy_by_category": {
            cat: {"accuracy": accuracy.get(cat, 0.0), "attempts": attempts.get(cat, 0)}
            for cat in _CATEGORIES
        },
        "weak_categories": weak[:3],
        "wrong_count": len(wrong_log),
        "target_score": v.get("target_score", 70),
    }
