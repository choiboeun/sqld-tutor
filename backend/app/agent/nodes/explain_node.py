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

    # 마지막 메시지가 답 번호(adaptive 자동 유도)면 오답 태그로 개념 결정
    is_adaptive = _ANSWER_RE.match(raw)
    if is_adaptive:
        wrong_tags = state.get("last_wrong_tags") or []
        if wrong_tags:
            # 태그 중 가장 핵심적인 1개만 사용 (너무 많으면 RAG 검색 품질 저하)
            concept = wrong_tags[0]
        else:
            concept = state.get("last_category") or "SQLD 개념"
    else:
        concept = raw or "SQLD 개념"

    result = explain_concept.invoke({"concept": concept, "level": student_level})

    updates: dict = {"messages": [AIMessage(content=result)]}
    if is_adaptive:
        updates["last_explained_category"] = state.get("last_category")
    return updates
