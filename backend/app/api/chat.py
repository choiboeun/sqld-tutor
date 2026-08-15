import asyncio
import json
import time
from collections import defaultdict
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage

from app.agent.graph import graph
from app.agent.tools.question_tools import get_question_by_id
from app.analytics import log_event
from app.auth import get_current_user_id

router = APIRouter()

_rate_limit: dict[str, list[float]] = defaultdict(list)
_LIMIT = 200   # 1시간에 최대 200회
_WINDOW = 3600


def _check_rate_limit(user_id: str) -> bool:
    now = time.time()
    calls = _rate_limit[user_id]
    _rate_limit[user_id] = [t for t in calls if now - t < _WINDOW]
    if len(_rate_limit[user_id]) >= _LIMIT:
        return False
    _rate_limit[user_id].append(now)
    return True

INITIAL_STATE = {
    "current_mode": "chat",
    "pending_question": {},
    "question_history": [],
    "last_category": None,
    "student_level": "beginner",
    "target_score": 70,
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
    "correct_count_by_category": {},
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
    "diagnostic_question_count": 0,
    "follow_up_mode": False,
    "is_diagnostic_done": False,
    "wrong_answer_log": None,
    "last_wrong_tags": None,
    "last_was_correct": None,
    "last_answered_question": None,
}


class ChatRequest(BaseModel):
    message: str
    thread_id: str = "default"
    target_score: int = 70
    clear_pending: bool = False
    client_pending_question: dict = {}


def _get_text(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = [c["text"] for c in content if isinstance(c, dict) and c.get("type") == "text"]
        return "".join(parts) if parts else ""
    return str(content)


async def _stream_response(message: str, thread_id: str, user_id: str = "anonymous", target_score: int = 70, clear_pending: bool = False, client_pending_question: Optional[dict] = None):
    config = {"configurable": {"thread_id": thread_id}}

    existing = await graph.aget_state(config)
    existing_msgs = existing.values.get("messages", []) if existing.values else []
    is_new = len(existing_msgs) == 0

    if is_new:
        input_data = {**INITIAL_STATE, "messages": [HumanMessage(content=message)], "user_id": user_id, "target_score": target_score}
        log_event(user_id, "session_start", {"thread_id": thread_id})  # JWT 검증된 user_id 사용
    else:
        input_data = {"messages": [HumanMessage(content=message)]}
        if clear_pending:
            input_data["pending_question"] = {}
        elif client_pending_question and isinstance(client_pending_question, dict) and client_pending_question.get("id"):
            # 클라이언트가 캐시한 pending_question 사용 → checkpoint 저장 완료 전에도 즉시 채점 가능
            # answer 필드는 클라이언트에 전송하지 않으므로 서버에서 복원
            full_q = get_question_by_id(client_pending_question["id"])
            if full_q:
                input_data["pending_question"] = {**client_pending_question, "answer": full_q["answer"]}
            else:
                input_data["pending_question"] = client_pending_question
            # 스테일 체크포인트 우회 — pending_question에 포함된 state_updater 최신 값 주입
            _pq = client_pending_question
            if isinstance(_pq.get("_diag_count"), int):
                input_data["diagnostic_question_count"] = _pq["_diag_count"]
            if isinstance(_pq.get("_total_answered"), int):
                input_data["total_answered"] = _pq["_total_answered"]
            if isinstance(_pq.get("_attempts_by_cat"), dict):
                input_data["attempts_by_category"] = _pq["_attempts_by_cat"]
            if isinstance(_pq.get("_accuracy_by_cat"), dict):
                input_data["accuracy_by_category"] = _pq["_accuracy_by_cat"]
            if isinstance(_pq.get("_wrong_log"), dict):
                input_data["wrong_answer_log"] = _pq["_wrong_log"]
            if isinstance(_pq.get("_streak"), int):
                input_data["streak"] = _pq["_streak"]
            if isinstance(_pq.get("_is_diagnostic"), bool):
                input_data["is_diagnostic"] = _pq["_is_diagnostic"]

    NON_LLM_NODES = {"drill", "review", "diagnose", "sql", "state_updater", "explain", "diagnostic_block"}
    KEEPALIVE_INTERVAL = 10  # 초 — LLM 무응답 구간에 중간 서버 연결 유지

    # LangGraph 이벤트를 별도 태스크로 수집 → 메인 루프에서 타임아웃마다 keepalive 전송
    queue: asyncio.Queue = asyncio.Queue()

    async def _collect():
        try:
            async for event in graph.astream_events(input_data, config=config, version="v2"):
                await queue.put(("event", event))
        except Exception as e:
            print(f"[stream_error] {type(e).__name__}: {e}")
            await queue.put(("error", e))
        finally:
            await queue.put(("done", None))

    collector = asyncio.create_task(_collect())

    # state_updater 출력 캐시 — pending_question SSE에 포함해 스테일 체크포인트 우회
    _su_cache: dict = {}

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
                yield f"data: {json.dumps({'type': 'error', 'content': str(payload)}, ensure_ascii=False)}\n\n"
                yield f"data: {json.dumps({'type': 'done'}, ensure_ascii=False)}\n\n"
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
                                msg_type = "concept" if name == "explain" else "message"
                                yield f"data: {json.dumps({'type': msg_type, 'content': content}, ensure_ascii=False)}\n\n"
                    if name in ("drill", "review") and output.get("last_grade_result"):
                        yield f"data: {json.dumps({'type': 'loading'}, ensure_ascii=False)}\n\n"
                    if name == "state_updater":
                        # state_updater 출력 캐시 — 이후 pending_question SSE에 첨부
                        _su_cache["diagnostic_question_count"] = output.get("diagnostic_question_count")
                        _su_cache["total_answered"] = output.get("total_answered")
                        _su_cache["attempts_by_category"] = output.get("attempts_by_category")
                        _su_cache["accuracy_by_category"] = output.get("accuracy_by_category")
                        _su_cache["wrong_answer_log"] = output.get("wrong_answer_log")
                        _su_cache["streak"] = output.get("streak")
                        _su_cache["is_diagnostic"] = output.get("is_diagnostic")
                        stats_payload = {
                            "accuracy_by_category": output.get("accuracy_by_category", {}),
                            "attempts_by_category": output.get("attempts_by_category", {}),
                            "total_answered": output.get("total_answered", 0),
                            "streak": output.get("streak", 0),
                        }
                        yield f"data: {json.dumps({'type': 'stats_updated', 'content': stats_payload}, ensure_ascii=False)}\n\n"
                        if output.get("suggest_category_switch"):
                            yield f"data: {json.dumps({'type': 'loading'}, ensure_ascii=False)}\n\n"
                    pq = output.get("pending_question")
                    if pq and isinstance(pq, dict) and pq.get("id"):
                        # state_updater 값을 포함 → 스테일 체크포인트 읽어도 누적 데이터 정확
                        pq_payload = {k: v for k, v in pq.items() if k != "answer"}
                        if _su_cache.get("diagnostic_question_count") is not None:
                            pq_payload["_diag_count"] = _su_cache["diagnostic_question_count"]
                        if _su_cache.get("total_answered") is not None:
                            pq_payload["_total_answered"] = _su_cache["total_answered"]
                        if _su_cache.get("attempts_by_category") is not None:
                            pq_payload["_attempts_by_cat"] = _su_cache["attempts_by_category"]
                        if _su_cache.get("accuracy_by_category") is not None:
                            pq_payload["_accuracy_by_cat"] = _su_cache["accuracy_by_category"]
                        if _su_cache.get("wrong_answer_log") is not None:
                            pq_payload["_wrong_log"] = _su_cache["wrong_answer_log"]
                        if _su_cache.get("streak") is not None:
                            pq_payload["_streak"] = _su_cache["streak"]
                        if _su_cache.get("is_diagnostic") is not None:
                            pq_payload["_is_diagnostic"] = _su_cache["is_diagnostic"]
                        yield f"data: {json.dumps({'type': 'pending_question', 'content': pq_payload}, ensure_ascii=False)}\n\n"

            # LLM 토큰 단위 스트리밍 — chatbot만 적용
            elif kind == "on_chat_model_stream" and node == "chatbot":
                chunk = event["data"]["chunk"]
                token = _get_text(chunk.content) if hasattr(chunk, "content") else ""
                if token:
                    yield f"data: {json.dumps({'type': 'token', 'content': token}, ensure_ascii=False)}\n\n"

    finally:
        collector.cancel()
        try:
            await collector
        except asyncio.CancelledError:
            pass

    yield f"data: {json.dumps({'type': 'done'}, ensure_ascii=False)}\n\n"


@router.post("/chat")
async def chat(req: ChatRequest, user_id: str = Depends(get_current_user_id)):
    if req.thread_id != user_id:
        raise HTTPException(status_code=403, detail="접근 권한이 없어요.")
    if not _check_rate_limit(user_id):
        raise HTTPException(status_code=429, detail="요청이 너무 많아요. 잠시 후 다시 시도해주세요.")
    return StreamingResponse(
        _stream_response(req.message, req.thread_id, user_id, req.target_score, req.clear_pending, req.client_pending_question or None),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
