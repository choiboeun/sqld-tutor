from fastapi import APIRouter, Depends, HTTPException
from app.agent.graph import graph
from app.auth import get_current_user_id

router = APIRouter()

_CATEGORIES = [
    "데이터 모델링 기초", "데이터 모델과 SQL", "SELECT & WHERE",
    "함수", "GROUP BY & ORDER BY", "조인",
    "서브쿼리 & Top N", "집합 연산자 & 그룹 함수",
    "윈도우 함수", "SQL 활용 기타", "관리 구문",
]


@router.get("/progress/{thread_id}")
async def get_progress(thread_id: str, user_id: str = Depends(get_current_user_id)):
    if thread_id != user_id:
        raise HTTPException(status_code=403, detail="접근 권한이 없어요.")
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
            "target_score": 70,
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

    is_diagnostic = v.get("is_diagnostic", False)
    is_diagnostic_done = v.get("is_diagnostic_done", False)
    diag_progress = 0
    if is_diagnostic:
        total = v.get("total_answered", 0)
        start = v.get("diagnostic_start_count")
        diag_progress = (total - start) if start is not None else 0

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
        "is_diagnostic_in_progress": is_diagnostic and not is_diagnostic_done,
        "diagnostic_progress": diag_progress,
    }
