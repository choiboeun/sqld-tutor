import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage

from app.agent.graph import graph

router = APIRouter()

INITIAL_STATE = {
    "current_mode": "chat",
    "pending_question": {},
    "question_history": [],
    "last_category": None,
    "student_level": "beginner",
    "target_score": 60,
    "difficulty_preference": "mix",
    "accuracy_by_category": {
        "데이터 모델링 기초": 0.0,
        "데이터 모델과 SQL": 0.0,
        "SELECT & WHERE": 0.0,
        "함수": 0.0,
        "GROUP BY & ORDER BY": 0.0,
        "조인": 0.0,
        "서브쿼리 & Top N": 0.0,
        "집합 연산자 & 그룹 함수": 0.0,
        "윈도우 함수": 0.0,
        "SQL 활용 기타": 0.0,
        "관리 구문": 0.0,
    },
    "attempts_by_category": {},
    "recent_mistakes": [],
    "total_answered": 0,
    "session_question_count": 0,
    "streak": 0,
    "consecutive_wrong": 0,
    "retry_count": 0,
    "last_grade_result": None,
    "suggest_category_switch": False,
    "last_explained_category": None,
}


class ChatRequest(BaseModel):
    message: str
    thread_id: str = "default"


def _get_text(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = [c["text"] for c in content if isinstance(c, dict) and c.get("type") == "text"]
        return "".join(parts) if parts else ""
    return str(content)


async def _stream_response(message: str, thread_id: str):
    config = {"configurable": {"thread_id": thread_id}}

    existing = graph.get_state(config)
    existing_msgs = existing.values.get("messages", []) if existing.values else []
    is_new = len(existing_msgs) == 0

    if is_new:
        input_data = {**INITIAL_STATE, "messages": [HumanMessage(content=message)]}
    else:
        input_data = {"messages": [HumanMessage(content=message)]}

    # on_chain_end 에서 메시지를 실시간으로 캡처할 노드 목록 (LLM 미사용)
    NON_LLM_NODES = {"drill", "review", "diagnose", "sql", "state_updater"}

    try:
        async for event in graph.astream_events(input_data, config=config, version="v2"):
            kind = event["event"]
            name = event.get("name", "")

            # 비LLM 노드 완료 → 채점/문제/진단 메시지를 발생 순서대로 즉시 전송
            if kind == "on_chain_end" and name in NON_LLM_NODES:
                output = event["data"].get("output") or {}
                if isinstance(output, dict):
                    for msg in output.get("messages", []):
                        if isinstance(msg, AIMessage) and not getattr(msg, "tool_calls", None):
                            content = _get_text(msg.content)
                            if content:
                                yield f"data: {json.dumps({'type': 'message', 'content': content})}\n\n"

            # LLM 토큰 단위 스트리밍 (chatbot, explain)
            elif kind == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                token = _get_text(chunk.content) if hasattr(chunk, "content") else ""
                if token:
                    yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    yield f"data: {json.dumps({'type': 'done'})}\n\n"


@router.post("/chat")
async def chat(req: ChatRequest):
    return StreamingResponse(
        _stream_response(req.message, req.thread_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
