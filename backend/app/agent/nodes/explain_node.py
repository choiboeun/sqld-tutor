import asyncio
import re
from langchain_core.messages import AIMessage, HumanMessage
from app.agent.state import TutorState
from app.agent.tools.explain_tools import explain_concept

_ANSWER_RE = re.compile(r"^[1-4]번?\s*$")
# adaptive 트리거가 아닌 비개념 명령어("문제 줘", "다음 문제" 등)가 last_human으로 들어온 경우 감지
_NON_CONCEPT = re.compile(r"문제\s*(줘|내줘|풀게|풀어|주세요)?|다음\s*문제|새\s*문제")


async def explain_node(state: TutorState) -> dict:
    student_level = state.get("student_level", "beginner")

    last_human = next(
        (m for m in reversed(state["messages"]) if isinstance(m, HumanMessage)), None
    )
    raw = last_human.content.strip() if last_human else ""

    # 마지막 메시지가 답 번호(adaptive 자동 유도)면 오답 태그로 개념 결정
    is_adaptive = _ANSWER_RE.match(raw)
    if is_adaptive or _NON_CONCEPT.search(raw):
        # adaptive 유도(답 번호) 또는 "문제 줘" 같은 비개념 명령어 → 오답 태그/카테고리로 폴백
        wrong_tags = state.get("last_wrong_tags") or []
        if wrong_tags:
            concept = wrong_tags[0]
        else:
            concept = state.get("last_category") or "SQLD 개념"
        is_adaptive = True  # last_explained_category 업데이트 대상으로 표시
    else:
        concept = raw or "SQLD 개념"

    # explain_concept은 sync이므로 to_thread로 이벤트 루프 블로킹 방지
    result = await asyncio.to_thread(
        explain_concept.invoke, {"concept": concept, "level": student_level}
    )

    updates: dict = {"messages": [AIMessage(content=result)]}
    if is_adaptive:
        updates["last_explained_category"] = state.get("last_category")
    return updates
