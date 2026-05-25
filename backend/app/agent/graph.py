from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import AIMessage

from app.agent.state import TutorState
from app.agent.nodes.chatbot import chatbot_node
from app.agent.tools.question_tools import generate_sqld_question


def should_use_tool(state: TutorState) -> str:
    last_message = state["messages"][-1]
    if isinstance(last_message, AIMessage) and last_message.tool_calls:
        return "tools"
    return END


tool_node = ToolNode([generate_sqld_question])

builder = StateGraph(TutorState)

builder.add_node("chatbot", chatbot_node)
builder.add_node("tools", tool_node)

builder.add_edge(START, "chatbot")
builder.add_conditional_edges("chatbot", should_use_tool)
builder.add_edge("tools", "chatbot")

memory = MemorySaver()
graph = builder.compile(checkpointer=memory)
