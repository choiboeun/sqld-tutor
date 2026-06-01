from langchain_core.messages import SystemMessage
from app.agent.state import TutorState
from app.agent.llm import llm
from app.agent.tools.question_tools import generate_sqld_question
from app.agent.tools.grade_tools import grade_answer
from app.agent.tools.sql_tools import execute_sql
from app.agent.tools.explain_tools import explain_concept

ALL_TOOLS = [generate_sqld_question, grade_answer, execute_sql, explain_concept]
llm_with_tools = llm.bind_tools(ALL_TOOLS)

_SYSTEM = """당신은 SQLD 자격증 시험을 도와주는 AI 튜터입니다.
필요에 따라 다음 도구를 사용할 수 있습니다:
- generate_sqld_question: 문제 출제 (category, difficulty 지정 가능)
- grade_answer: 답안 채점
- execute_sql: SQL 실행 (EMP, DEPT, SALGRADE 테이블 사용 가능)
- explain_concept: 개념 설명
한국어로 친절하게 답변하세요."""


def chatbot_node(state: TutorState) -> dict:
    messages = [SystemMessage(content=_SYSTEM)] + list(state["messages"])
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}
