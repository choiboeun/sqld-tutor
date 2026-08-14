import asyncio
import os
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from supabase import create_client
from app.auth import get_current_user_id
from app.agent.graph import graph
from app.agent.tools.question_tools import get_question_by_id

router = APIRouter()


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


@router.get("/review-timing/{thread_id}")
async def get_review_timing(thread_id: str, user_id: str = Depends(get_current_user_id)):
    if thread_id != user_id:
        raise HTTPException(status_code=403, detail="접근 권한이 없어요.")

    config = {"configurable": {"thread_id": thread_id}}
    state = await graph.aget_state(config)

    empty = {"today": [], "tomorrow": [], "this_week": [], "overdue": []}
    if not state.values:
        return empty

    wrong_log: dict = state.values.get("wrong_answer_log") or {}
    if not wrong_log:
        return empty

    # category lookup
    qid_category: dict[str, str] = {}
    for qid in wrong_log:
        q = get_question_by_id(qid)
        if q:
            qid_category[qid] = q["category"]

    # timestamps from user_events: most recent wrong event per qid
    ts_map: dict[str, str] = {}
    client = _get_supabase()
    if client:
        since = (datetime.now(timezone.utc) - timedelta(days=180)).isoformat()
        try:
            rows = await asyncio.to_thread(
                lambda: client.table("user_events")
                .select("properties, created_at")
                .eq("user_id", thread_id)
                .eq("event_type", "question_answered")
                .gte("created_at", since)
                .execute()
            )
        except Exception:
            rows = type("R", (), {"data": []})()
        for row in rows.data or []:
            props = row.get("properties", {})
            qid = str(props.get("question_id", ""))
            if qid not in wrong_log:
                continue
            if props.get("correct", True):
                continue
            ts = row["created_at"]
            if qid not in ts_map or ts > ts_map[qid]:
                ts_map[qid] = ts

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
        days_ago = (now - ts).total_seconds() / 86400
        groups[_bucket(days_ago)].append(item)

    return groups
