from langchain_core.messages import HumanMessage, SystemMessage
from app.agent.state import TutorState
from app.agent.llm import llm

_SYSTEM = """당신은 SQLD 자격증 시험 전문 튜터입니다.
학생의 질문에 대해 SQLD 시험 관점에서 핵심만 명확하게 설명하세요.
설명 순서: 개념 정의 → 시험 포인트 → 간단한 예시
불필요하게 길지 않게, 핵심만 전달하세요.
한국어로 답변하세요."""


def explain_node(state: TutorState) -> dict:
    last_grade = state.get("last_grade_result") or {}
    system_msg = SystemMessage(content=_SYSTEM)

    # 방금 틀린 문제가 있으면 해당 카테고리 컨텍스트를 힌트로 추가
    if last_grade and not last_grade.get("correct"):
        category = last_grade.get("category", "")
        last_human = next(
            (m for m in reversed(state["messages"]) if isinstance(m, HumanMessage)), None
        )
        hint_text = f"[참고: 방금 '{category}' 카테고리 문제를 틀렸습니다]\n"
        hint_text += last_human.content if last_human else "관련 개념을 설명해주세요."
        messages = [system_msg] + state["messages"][:-1] + [HumanMessage(content=hint_text)]
    else:
        messages = [system_msg] + list(state["messages"])

    response = llm.invoke(messages)
    return {"messages": [response]}
