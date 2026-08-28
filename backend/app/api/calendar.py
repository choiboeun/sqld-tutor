import asyncio
import os
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from supabase import create_client
from app.auth import get_current_user_id

router = APIRouter()


def _get_supabase():
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        return None
    return create_client(url, key)


@router.get("/calendar/{thread_id}")
async def get_calendar(thread_id: str, user_id: str = Depends(get_current_user_id)):
    if thread_id != user_id:
        raise HTTPException(status_code=403, detail="접근 권한이 없어요.")

    client = _get_supabase()
    if not client:
        return {"dates": {}}

    since = (datetime.now(timezone.utc) - timedelta(days=91)).isoformat()

    try:
        result = await asyncio.to_thread(
            lambda: client.table("user_events")
            .select("created_at")
            .eq("user_id", thread_id)
            .eq("event_type", "question_answered")
            .gte("created_at", since)
            .execute()
        )
    except Exception:
        return {"dates": {}}

    counts: dict[str, int] = defaultdict(int)
    for row in result.data or []:
        created_at = row.get("created_at")
        if not created_at:
            continue
        counts[created_at[:10]] += 1

    return {"dates": dict(counts)}
