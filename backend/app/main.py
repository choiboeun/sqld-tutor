import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

_sentry_dsn = os.getenv("SENTRY_DSN")
if _sentry_dsn:
    import sentry_sdk

    sentry_sdk.init(
        dsn=_sentry_dsn,
        traces_sample_rate=0.0,  # 성능 트레이싱 비활성화 — 에러 캡처만 사용(무료 한도 절약)
        send_default_pii=False,  # 사용자 IP·요청 헤더 등 개인정보는 전송하지 않음
    )

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import chat, progress, wrong_answers, mini_chat, sql_execute, exam, home_data, inquiries
from app.db.checkpointer import open_checkpointer_pool


@asynccontextmanager
async def lifespan(app: FastAPI):
    await open_checkpointer_pool()
    yield
    from app.db.checkpointer import _async_pool
    if _async_pool is not None:
        try:
            await _async_pool.close()
        except Exception:
            pass


app = FastAPI(title="SQLD AI Tutor API", lifespan=lifespan)

_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,https://sqld-tutor.vercel.app")
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api")
app.include_router(progress.router, prefix="/api")
app.include_router(wrong_answers.router, prefix="/api")
app.include_router(mini_chat.router, prefix="/api")
app.include_router(sql_execute.router, prefix="/api")
app.include_router(exam.router, prefix="/api")
app.include_router(home_data.router, prefix="/api")
app.include_router(inquiries.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
