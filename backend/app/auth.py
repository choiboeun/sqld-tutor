import os
import time
import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

_security = HTTPBearer()
_token_cache: dict[str, tuple[str, float]] = {}
_CACHE_TTL = 300  # 5분


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(_security),
) -> str:
    token = credentials.credentials
    now = time.time()

    cached = _token_cache.get(token)
    if cached and now < cached[1]:
        return cached[0]

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
    user_id = resp.json()["id"]
    _token_cache[token] = (user_id, now + _CACHE_TTL)
    return user_id
