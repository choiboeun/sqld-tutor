from langchain_core.tools import tool
from app.agent.llm import llm

_PROMPT = """당신은 SQLD 자격증 시험 전문 튜터입니다.
다음 개념을 학생 수준에 맞게 설명하세요.
설명 순서: 개념 정의 → 시험 포인트 → 간단한 예시
수준: {level} (beginner=쉽게, intermediate=표준, advanced=심화)
한국어로 답변하세요."""


@tool
def explain_concept(concept: str, level: str = "beginner") -> str:
    """SQLD 개념을 학생 수준에 맞게 설명한다.
    concept: 설명할 개념 (예: 'JOIN', 'HAVING', 'ROLLUP')
    level: 학생 수준 ('beginner', 'intermediate', 'advanced')
    7주차에 RAG 기반으로 교체 예정.
    """
    from langchain_core.messages import HumanMessage, SystemMessage
    messages = [
        SystemMessage(content=_PROMPT.format(level=level)),
        HumanMessage(content=f"{concept}에 대해 설명해주세요."),
    ]
    response = llm.invoke(messages)
    return response.content
