import os
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from supabase import create_client
from app.agent.graph import graph
from app.agent.tools.question_tools import get_question_by_id
from app.auth import get_current_user_id

router = APIRouter()

_CATEGORIES = [
    "데이터 모델링 기초", "데이터 모델과 SQL", "SELECT & WHERE",
    "함수", "GROUP BY & ORDER BY", "조인",
    "서브쿼리 & Top N", "집합 연산자 & 그룹 함수",
    "윈도우 함수", "SQL 활용 기타", "관리 구문",
]


def _get_supabase():
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        return None
    return create_client(url, key)


def _bucket(days_ago: float) -> str:
    if days_ago < 1:
        return "today"
    if days_ago < 2:
        return "tomorrow"
    if days_ago <= 7:
        return "this_week"
    return "overdue"


@router.get("/home-data/{thread_id}")
async def get_home_data(thread_id: str, user_id: str = Depends(get_current_user_id)):
    if thread_id != user_id:
        raise HTTPException(status_code=403, detail="접근 권한이 없어요.")

    config = {"configurable": {"thread_id": thread_id}}
    state = await graph.aget_state(config)

    # ── progress ──────────────────────────────────────────────
    empty_progress = {
        "total_answered": 0,
        "streak": 0,
        "accuracy_by_category": {cat: {"accuracy": 0.0, "attempts": 0} for cat in _CATEGORIES},
        "weak_categories": [],
        "wrong_count": 0,
        "target_score": 70,
        "is_diagnostic_in_progress": False,
        "diagnostic_progress": 0,
    }

    if not state.values:
        return {
            "progress": empty_progress,
            "calendar": {"dates": {}},
            "review_timing": {"today": [], "tomorrow": [], "this_week": [], "overdue": []},
        }

    v = state.values
    accuracy = v.get("accuracy_by_category") or {}
    attempts = v.get("attempts_by_category") or {}
    wrong_log: dict = v.get("wrong_answer_log") or {}
    is_diagnostic = v.get("is_diagnostic", False)

    weak = [
        {"category": cat, "accuracy": accuracy.get(cat, 0.0)}
        for cat in _CATEGORIES
        if attempts.get(cat, 0) >= 1 and accuracy.get(cat, 0.0) < 0.6
    ]
    weak.sort(key=lambda x: x["accuracy"])

    progress = {
        "total_answered": v.get("total_answered", 0),
        "streak": v.get("streak", 0),
        "accuracy_by_category": {
            cat: {"accuracy": accuracy.get(cat, 0.0), "attempts": attempts.get(cat, 0)}
            for cat in _CATEGORIES
        },
        "weak_categories": weak[:3],
        "wrong_count": len(wrong_log),
        "target_score": v.get("target_score", 70),
        "is_diagnostic_in_progress": is_diagnostic and not v.get("is_diagnostic_done", False),
        "diagnostic_progress": (v.get("diagnostic_question_count") or 0) if is_diagnostic else 0,
    }

    # ── 카테고리 조회 (review-timing 용) ──────────────────────
    qid_category: dict[str, str] = {}
    for qid in wrong_log:
        q = get_question_by_id(qid)
        if q:
            qid_category[qid] = q["category"]

    # ── Supabase: calendar + review-timing 쿼리 한 번 ──────────
    calendar_counts: dict[str, int] = defaultdict(int)
    ts_map: dict[str, str] = {}

    client = _get_supabase()
    if client:
        since = (datetime.now(timezone.utc) - timedelta(days=91)).isoformat()
        rows = (
            client.table("user_events")
            .select("properties, created_at")
            .eq("user_id", thread_id)
            .eq("event_type", "question_answered")
            .gte("created_at", since)
            .execute()
        )
        for row in rows.data or []:
            # calendar
            calendar_counts[row["created_at"][:10]] += 1

            # review-timing: most recent wrong event per qid
            props = row.get("properties", {})
            qid = str(props.get("question_id", ""))
            if qid in wrong_log and not props.get("correct", True):
                ts = row["created_at"]
                if qid not in ts_map or ts > ts_map[qid]:
                    ts_map[qid] = ts

    # ── review timing 그룹 ────────────────────────────────────
    now = datetime.now(timezone.utc)
    groups: dict[str, list] = {"today": [], "tomorrow": [], "this_week": [], "overdue": []}

    for qid in wrong_log:
        item = {"qid": qid, "category": qid_category.get(qid, "미분류")}
        if qid not in ts_map:
            groups["today"].append(item)
            continue
        try:
            ts = datetime.fromisoformat(ts_map[qid].replace("Z", "+00:00"))
        except Exception:
            groups["today"].append(item)
            continue
        groups[_bucket((now - ts).total_seconds() / 86400)].append(item)

    return {
        "progress": progress,
        "calendar": {"dates": dict(calendar_counts)},
        "review_timing": groups,
    }
