import logging
import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import create_client
from app.auth import get_current_user_id, get_current_user_email

router = APIRouter()

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "")
if not ADMIN_EMAIL:
    logging.warning("[inquiries] ADMIN_EMAIL 환경변수가 설정되지 않았습니다. 관리자 API(/admin/inquiries)가 비활성화됩니다.")


def _get_supabase():
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        return None
    return create_client(url, key)


class InquiryCreate(BaseModel):
    message: str


# ── 문의 제출 (로그인 사용자) ──────────────────────────────────────
@router.post("/inquiries")
async def create_inquiry(
    body: InquiryCreate,
    user_id: str = Depends(get_current_user_id),
    user_email: str = Depends(get_current_user_email),
):
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="내용을 입력해주세요.")

    client = _get_supabase()
    if not client:
        raise HTTPException(status_code=500, detail="서버 오류가 발생했습니다.")

    client.table("inquiries").insert({
        "user_id": user_id,
        "user_email": user_email,
        "message": body.message.strip(),
        "status": "new",
    }).execute()

    return {"ok": True}


# ── 관리자 전용: 전체 조회 ─────────────────────────────────────────
@router.get("/admin/inquiries")
async def get_inquiries(
    user_email: str = Depends(get_current_user_email),
):
    if user_email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")

    client = _get_supabase()
    if not client:
        raise HTTPException(status_code=500, detail="서버 오류가 발생했습니다.")

    result = (
        client.table("inquiries")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


# ── 관리자 전용: 상태 변경 ─────────────────────────────────────────
class StatusUpdate(BaseModel):
    status: str


@router.patch("/admin/inquiries/{inquiry_id}")
async def update_inquiry_status(
    inquiry_id: str,
    body: StatusUpdate,
    user_email: str = Depends(get_current_user_email),
):
    if user_email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다.")

    if body.status not in ("new", "read", "resolved"):
        raise HTTPException(status_code=400, detail="잘못된 상태값입니다.")

    client = _get_supabase()
    if not client:
        raise HTTPException(status_code=500, detail="서버 오류가 발생했습니다.")

    client.table("inquiries").update({"status": body.status}).eq("id", inquiry_id).execute()
    return {"ok": True}
