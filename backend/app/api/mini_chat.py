import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from app.agent.llm import llm
from app.auth import get_current_user_id

router = APIRouter()


class MiniMessage(BaseModel):
    role: str
    content: str


class MiniChatRequest(BaseModel):
    question_context: dict
    messages: list[MiniMessage] = []
    user_message: str


def _build_system_prompt(ctx: dict) -> str:
    options_text = ""
    for opt in ctx.get("options", []):
        options_text += f"{opt['num']}. {opt['text']}\n"

    return f"""당신은 SQLD AI 튜터입니다. 학생이 오답 회고 중 아래 문제에 대해 질문하고 있습니다.

[문제 정보]
카테고리: {ctx.get('category', '')}
난이도: {ctx.get('difficulty', '')}
문제: {ctx.get('question', '')}
보기:
{options_text}정답: {ctx.get('correct_answer', '')}번
해설: {ctx.get('explanation', '')}

역할:
- 학생의 질문에 위 문제 맥락을 바탕으로 친절하고 정확하게 답하세요.
- 개념 설명, 관련 이론, 오답 이유 등을 자유롭게 설명하세요.
- 새로운 문제를 출제하거나 "다음 문제", "풀어볼까요" 같은 유도는 절대 하지 마세요.
- 답변은 간결하고 핵심 위주로 작성하세요."""


@router.post("/mini-chat")
async def mini_chat(request: MiniChatRequest, _: str = Depends(get_current_user_id)):
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

    return StreamingResponse(event_stream(), media_type="text/event-stream")
