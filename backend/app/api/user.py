import os
import logging
import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.auth import get_current_user_id

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

router = APIRouter()
_security = HTTPBearer()


@router.delete("/user")
async def delete_user(
    credentials: HTTPAuthorizationCredentials = Depends(_security),
    user_id: str = Depends(get_current_user_id),
):
    token = credentials.credentials

    async with httpx.AsyncClient() as client:
        admin_resp = await client.delete(
            f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}",
            headers={
                "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                "apikey": SUPABASE_SERVICE_ROLE_KEY,
            },
            timeout=10.0,
        )
        if admin_resp.status_code not in (200, 204):
            raise HTTPException(status_code=500, detail=f"계정 삭제 실패: {admin_resp.text}")

    async with httpx.AsyncClient() as client:
        rpc_resp = await client.post(
            f"{SUPABASE_URL}/rest/v1/rpc/delete_user",
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": SUPABASE_ANON_KEY,
                "Content-Type": "application/json",
            },
            json={},
            timeout=10.0,
        )
        if rpc_resp.status_code not in (200, 204):
            raise HTTPException(status_code=500, detail=f"학습 데이터 삭제 실패: {rpc_resp.text}")

    # LangGraph checkpoint 테이블에서 해당 유저 대화 기록 삭제
    from app.db.checkpointer import _async_pool
    if _async_pool is not None:
        try:
            async with _async_pool.connection() as conn:
                await conn.execute("DELETE FROM checkpoint_blobs WHERE thread_id = %s", (user_id,))
                await conn.execute("DELETE FROM checkpoint_writes WHERE thread_id = %s", (user_id,))
                await conn.execute("DELETE FROM checkpoints WHERE thread_id = %s", (user_id,))
        except Exception as e:
            logging.warning("[delete_user] checkpoint 삭제 실패: %s", e)

    return {"message": "계정이 삭제되었습니다."}
