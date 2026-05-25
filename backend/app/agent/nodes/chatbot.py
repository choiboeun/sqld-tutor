import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from app.agent.state import TutorState
from app.agent.tools.question_tools import generate_sqld_question

load_dotenv(os.path.join(os.path.dirname(__file__), "../../../.env"))

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=os.getenv("GEMINI_API_KEY"),
)

llm_with_tools = llm.bind_tools([generate_sqld_question])

SYSTEM_PROMPT = """당신은 SQLD 자격증 시험을 도와주는 AI 튜터입니다.
사용자가 '문제 줘', '문제 내줘' 등을 요청하면 generate_sqld_question 도구를 호출해 문제를 출제하세요.
문제를 출제할 때는 선택지를 번호와 함께 보기 좋게 보여주세요.
사용자가 번호로 답을 말하면 pending_question의 정답과 비교해서 채점해주세요.
한국어로 친절하게 답변하세요."""


def chatbot_node(state: TutorState) -> dict:
    from langchain_core.messages import SystemMessage
    messages = [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}
