import asyncio
import os
import time
from typing import Optional
import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

_security = HTTPBearer()
_security_optional = HTTPBearer(auto_error=False)
# (user_id, email, expiry)
_token_cache: dict[str, tuple[str, str, float]] = {}
_token_cache_lock = asyncio.Lock()
_CACHE_TTL = 300  # 5분


async def _fetch_user_info(token: str) -> tuple[str, str]:
    """Returns (user_id, email). Caches result for CACHE_TTL seconds."""
    now = time.time()
    async with _token_cache_lock:
        cached = _token_cache.get(token)
        if cached and now < cached[2]:
            return cached[0], cached[1]

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": SUPABASE_ANON_KEY,
                },
                timeout=5.0,
            )
    except (httpx.ConnectError, httpx.TimeoutException, httpx.RequestError):
        raise HTTPException(status_code=503, detail="인증 서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.")
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="인증이 필요해요.")
    data = resp.json()
    user_id = data["id"]
    email = data.get("email", "")

    async with _token_cache_lock:
        _token_cache[token] = (user_id, email, now + _CACHE_TTL)
        # 만료 항목 주기적 정리 (캐시 크기가 100 초과 시)
        if len(_token_cache) > 100:
            stale = [k for k, v in _token_cache.items() if now >= v[2]]
            for k in stale:
                _token_cache.pop(k, None)

    return user_id, email


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(_security),
) -> str:
    user_id, _ = await _fetch_user_info(credentials.credentials)
    return user_id


async def get_optional_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_security_optional),
) -> Optional[str]:
    """인증 헤더가 없으면 None 반환 (게스트 허용 엔드포인트용)."""
    if credentials is None:
        return None
    user_id, _ = await _fetch_user_info(credentials.credentials)
    return user_id


async def get_current_user_email(
    credentials: HTTPAuthorizationCredentials = Depends(_security),
) -> str:
    _, email = await _fetch_user_info(credentials.credentials)
    return email
