import json
import time
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from app.agent.llm import llm
from app.auth import get_current_user_id

router = APIRouter()

_rate_limit: dict[str, list[float]] = defaultdict(list)
_LIMIT = 30   # 1시간에 최대 30회
_WINDOW = 3600


def _check_rate_limit(user_id: str) -> bool:
    now = time.time()
    calls = _rate_limit[user_id]
    _rate_limit[user_id] = [t for t in calls if now - t < _WINDOW]
    if len(_rate_limit[user_id]) >= _LIMIT:
        return False
    _rate_limit[user_id].append(now)
    return True


class MiniMessage(BaseModel):
    role: str
    content: str


class QuestionContext(BaseModel):
    question: str = Field("", max_length=2000)
    explanation: str = Field("", max_length=2000)
    category: str = Field("", max_length=100)
    difficulty: str = Field("", max_length=20)
    correct_answer: int = 1
    options: list = []


class MiniChatRequest(BaseModel):
    question_context: QuestionContext
    messages: list[MiniMessage] = []
    user_message: str = Field(..., max_length=1000)


def _build_system_prompt(ctx: QuestionContext) -> str:
    options_text = ""
    for opt in ctx.options:
        if not isinstance(opt, dict):
            continue
        options_text += f"{opt.get('num', '?')}. {opt.get('text', '')}\n"

    return f"""당신은 SQLD AI 튜터입니다. 학생이 오답 회고 중 아래 문제에 대해 질문하고 있습니다.

[문제 정보]
카테고리: {ctx.category}
난이도: {ctx.difficulty}
문제: {ctx.question}
보기:
{options_text}정답: {ctx.correct_answer}번
해설: {ctx.explanation}

역할:
- 학생의 질문에 위 문제 맥락을 바탕으로 친절하고 정확하게 답하세요.
- 개념 설명, 관련 이론, 오답 이유 등을 자유롭게 설명하세요.
- 새로운 문제를 출제하거나 "다음 문제", "풀어볼까요" 같은 유도는 절대 하지 마세요.
- 답변은 간결하고 핵심 위주로 작성하세요."""


@router.post("/mini-chat")
async def mini_chat(request: MiniChatRequest, user_id: str = Depends(get_current_user_id)):
    if not _check_rate_limit(user_id):
        raise HTTPException(status_code=429, detail="잠시 후 다시 시도해주세요. (1시간에 30회 제한)")
    async def event_stream():
        try:
            system_prompt = _build_system_prompt(request.question_context)
            lc_messages = [SystemMessage(content=system_prompt)]

            for m in request.messages:
                if m.role == "user":
                    lc_messages.append(HumanMessage(content=m.content))
                elif m.role == "ai" and m.content:
                    lc_messages.append(AIMessage(content=m.content))

            lc_messages.append(HumanMessage(content=request.user_message))

            async for chunk in llm.astream(lc_messages):
                token = chunk.content if isinstance(chunk.content, str) else ""
                if token:
                    yield f"data: {json.dumps({'type': 'token', 'content': token}, ensure_ascii=False)}\n\n"

            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)}, ensure_ascii=False)}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
