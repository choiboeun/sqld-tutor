import re
from langchain_core.messages import AIMessage, HumanMessage
from app.agent.state import TutorState
from app.agent.tools.explain_tools import explain_concept

_ANSWER_RE = re.compile(r"^[1-4]번?")


def explain_node(state: TutorState) -> dict:
    student_level = state.get("student_level", "beginner")

    last_human = next(
        (m for m in reversed(state["messages"]) if isinstance(m, HumanMessage)), None
    )
    raw = last_human.content.strip() if last_human else ""

    # 마지막 메시지가 답 번호(adaptive 자동 유도)면 last_category로 개념 결정
    is_adaptive = _ANSWER_RE.match(raw)
    if is_adaptive:
        concept = state.get("last_category") or "SQLD 개념"
    else:
        concept = raw or "SQLD 개념"

    result = explain_concept.invoke({"concept": concept, "level": student_level})

    updates: dict = {"messages": [AIMessage(content=result)]}
    if is_adaptive:
        updates["last_explained_category"] = state.get("last_category")
    return updates
