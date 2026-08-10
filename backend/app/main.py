import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import chat, progress, wrong_answers, mini_chat, sql_execute, user, exam, calendar, review_timing, home_data
from app.db.checkpointer import open_checkpointer_pool


@asynccontextmanager
async def lifespan(app: FastAPI):
    await open_checkpointer_pool()
    yield


app = FastAPI(title="SQLD AI Tutor API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://sqld-tutor.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api")
app.include_router(progress.router, prefix="/api")
app.include_router(wrong_answers.router, prefix="/api")
app.include_router(mini_chat.router, prefix="/api")
app.include_router(sql_execute.router, prefix="/api")
app.include_router(user.router, prefix="/api")
app.include_router(exam.router, prefix="/api")
app.include_router(calendar.router, prefix="/api")
app.include_router(review_timing.router, prefix="/api")
app.include_router(home_data.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
