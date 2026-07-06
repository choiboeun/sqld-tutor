import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import chat, progress, wrong_answers

app = FastAPI(title="SQLD AI Tutor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api")
app.include_router(progress.router, prefix="/api")
app.include_router(wrong_answers.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
