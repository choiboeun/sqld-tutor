from langchain_core.messages import SystemMessage
from app.agent.state import TutorState
from app.agent.llm import llm
from app.agent.prompts import build_system_prompt
from app.agent.tools.question_tools import generate_sqld_question
from app.agent.tools.grade_tools import grade_answer
from app.agent.tools.sql_tools import execute_sql
from app.agent.tools.explain_tools import explain_concept

ALL_TOOLS = [generate_sqld_question, grade_answer, execute_sql, explain_concept]
llm_with_tools = llm.bind_tools(ALL_TOOLS)


def chatbot_node(state: TutorState) -> dict:
    system = SystemMessage(content=build_system_prompt(state))
    messages = [system] + list(state["messages"])
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}
