import os
import asyncio
from supabase import create_client

_client = None


def _get_client():
    global _client
    if _client is None:
        url = os.getenv("SUPABASE_URL", "")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        if url and key:
            _client = create_client(url, key)
    return _client


def log_event(user_id: str, event_type: str, properties: dict = None):
    try:
        client = _get_client()
        if not client:
            return
        client.table("user_events").insert({
            "user_id": user_id,
            "event_type": event_type,
            "properties": properties or {},
        }).execute()
    except Exception as e:
        print(f"[analytics] log_event 실패: {e}")
