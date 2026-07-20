import asyncio
import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage

from app.agent.graph import graph
from app.analytics import log_event
from app.auth import get_current_user_id

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
    "is_diagnostic": False,
    "diagnostic_start_count": None,
    "follow_up_mode": False,
    "is_diagnostic_done": False,
}


class ChatRequest(BaseModel):
    message: str
    thread_id: str = "default"
    user_id: str = "anonymous"
    target_score: int = 60
    clear_pending: bool = False
    client_pending_question: dict = {}


def _get_text(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = [c["text"] for c in content if isinstance(c, dict) and c.get("type") == "text"]
        return "".join(parts) if parts else ""
    return str(content)


async def _stream_response(message: str, thread_id: str, user_id: str = "anonymous", target_score: int = 60, clear_pending: bool = False, client_pending_question: Optional[dict] = None):
    config = {"configurable": {"thread_id": thread_id}}

    existing = await graph.aget_state(config)
    existing_msgs = existing.values.get("messages", []) if existing.values else []
    is_new = len(existing_msgs) == 0

    if is_new:
        input_data = {**INITIAL_STATE, "messages": [HumanMessage(content=message)], "user_id": user_id, "target_score": target_score}
        log_event(user_id, "session_start", {"thread_id": thread_id})
    else:
        input_data = {"messages": [HumanMessage(content=message)]}
        if clear_pending:
            input_data["pending_question"] = {}
        elif client_pending_question and isinstance(client_pending_question, dict) and client_pending_question.get("id"):
            # 클라이언트가 캐시한 pending_question 사용 → checkpoint 저장 완료 전에도 즉시 채점 가능
            input_data["pending_question"] = client_pending_question

    NON_LLM_NODES = {"drill", "review", "diagnose", "sql", "state_updater", "explain", "diagnostic_block"}
    KEEPALIVE_INTERVAL = 20  # 초 — LLM 무응답 구간에 중간 서버 연결 유지

    # LangGraph 이벤트를 별도 태스크로 수집 → 메인 루프에서 타임아웃마다 keepalive 전송
    queue: asyncio.Queue = asyncio.Queue()

    async def _collect():
        try:
            async for event in graph.astream_events(input_data, config=config, version="v2"):
                await queue.put(("event", event))
        except Exception as e:
            await queue.put(("error", e))
        finally:
            await queue.put(("done", None))

    collector = asyncio.create_task(_collect())

    try:
        while True:
            try:
                kind_tag, payload = await asyncio.wait_for(queue.get(), timeout=KEEPALIVE_INTERVAL)
            except asyncio.TimeoutError:
                # 이벤트 없는 구간 — SSE 코멘트로 연결 유지 (브라우저/프록시 timeout 방지)
                yield ": keepalive\n\n"
                continue

            if kind_tag == "done":
                break
            if kind_tag == "error":
                yield f"data: {json.dumps({'type': 'error', 'content': str(payload)})}\n\n"
                break

            event = payload
            kind = event["event"]
            name = event.get("name", "")
            node = event.get("metadata", {}).get("langgraph_node", "")

            # 지정 노드 완료 → 채점/문제/진단/설명 메시지를 즉시 전송 (post-processing 적용됨)
            if kind == "on_chain_end" and name in NON_LLM_NODES:
                output = event["data"].get("output") or {}
                if isinstance(output, dict):
                    for msg in output.get("messages", []):
                        if isinstance(msg, AIMessage) and not getattr(msg, "tool_calls", None):
                            content = _get_text(msg.content)
                            if content:
                                yield f"data: {json.dumps({'type': 'message', 'content': content})}\n\n"
                    if name in ("drill", "review") and output.get("last_grade_result"):
                        yield f"data: {json.dumps({'type': 'loading'})}\n\n"
                    if name == "state_updater" and output.get("suggest_category_switch"):
                        yield f"data: {json.dumps({'type': 'loading'})}\n\n"
                    pq = output.get("pending_question")
                    if pq and isinstance(pq, dict) and pq.get("id"):
                        yield f"data: {json.dumps({'type': 'pending_question', 'content': pq})}\n\n"

            # LLM 토큰 단위 스트리밍 — chatbot만 적용
            elif kind == "on_chat_model_stream" and node == "chatbot":
                chunk = event["data"]["chunk"]
                token = _get_text(chunk.content) if hasattr(chunk, "content") else ""
                if token:
                    yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

    finally:
        collector.cancel()
        try:
            await collector
        except asyncio.CancelledError:
            pass

    yield f"data: {json.dumps({'type': 'done'})}\n\n"


@router.post("/chat")
async def chat(req: ChatRequest, user_id: str = Depends(get_current_user_id)):
    if req.thread_id != user_id:
        raise HTTPException(status_code=403, detail="접근 권한이 없어요.")
    return StreamingResponse(
        _stream_response(req.message, req.thread_id, req.user_id, req.target_score, req.clear_pending, req.client_pending_question or None),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
