import os
import time
import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

_security = HTTPBearer()
# (user_id, email, expiry)
_token_cache: dict[str, tuple[str, str, float]] = {}
_CACHE_TTL = 300  # 5분


async def _fetch_user_info(token: str) -> tuple[str, str]:
    """Returns (user_id, email). Caches result for CACHE_TTL seconds."""
    now = time.time()
    cached = _token_cache.get(token)
    if cached:
        if now < cached[2]:
            return cached[0], cached[1]
        del _token_cache[token]

    # 만료 항목 주기적 정리 (캐시 크기가 100 초과 시)
    if len(_token_cache) > 100:
        stale = [k for k, v in _token_cache.items() if now >= v[2]]
        for k in stale:
            _token_cache.pop(k, None)

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": SUPABASE_ANON_KEY,
            },
            timeout=5.0,
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="인증이 필요해요.")
    data = resp.json()
    user_id = data["id"]
    email = data.get("email", "")
    _token_cache[token] = (user_id, email, now + _CACHE_TTL)
    return user_id, email


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(_security),
) -> str:
    user_id, _ = await _fetch_user_info(credentials.credentials)
    return user_id


async def get_current_user_email(
    credentials: HTTPAuthorizationCredentials = Depends(_security),
) -> str:
    _, email = await _fetch_user_info(credentials.credentials)
    return email
