from langchain_core.messages import SystemMessage
from app.agent.state import TutorState
from app.agent.llm import llm
from app.agent.tools.question_tools import generate_sqld_question

llm_with_tools = llm.bind_tools([generate_sqld_question])

_SYSTEM = """당신은 SQLD 자격증 시험을 도와주는 AI 튜터입니다.
일반적인 질문에 친절하게 답변하세요.
한국어로 답변하세요."""


def chatbot_node(state: TutorState) -> dict:
    messages = [SystemMessage(content=_SYSTEM)] + list(state["messages"])
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}
