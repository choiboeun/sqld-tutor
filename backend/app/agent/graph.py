from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from app.agent.state import TutorState
from app.agent.nodes.chatbot import chatbot_node
from app.agent.nodes.intent_classifier import intent_classifier
from app.agent.nodes.drill_node import drill_node
from app.agent.nodes.review_node import review_node
from app.agent.nodes.explain_node import explain_node
from app.agent.nodes.diagnose_node import diagnose_node
from app.agent.nodes.state_updater import state_updater


def route_by_intent(state: TutorState) -> str:
    return state.get("current_mode", "chat")


def after_drill(state: TutorState) -> str:
    """채점이 일어났으면 state_updater로, 문제 출제만 했으면 종료."""
    if state.get("last_grade_result"):
        return "state_updater"
    return END


builder = StateGraph(TutorState)

builder.add_node("intent_classifier", intent_classifier)
builder.add_node("drill", drill_node)
builder.add_node("review", review_node)
builder.add_node("explain", explain_node)
builder.add_node("diagnose", diagnose_node)
builder.add_node("chatbot", chatbot_node)
builder.add_node("state_updater", state_updater)

builder.add_edge(START, "intent_classifier")
builder.add_conditional_edges(
    "intent_classifier",
    route_by_intent,
    {"drill": "drill", "review": "review", "explain": "explain", "diagnose": "diagnose", "chat": "chatbot"},
)
builder.add_conditional_edges("drill", after_drill, {"state_updater": "state_updater", END: END})
builder.add_conditional_edges("review", after_drill, {"state_updater": "state_updater", END: END})
builder.add_edge("state_updater", END)
builder.add_edge("explain", END)
builder.add_edge("diagnose", END)
builder.add_edge("chatbot", END)

memory = MemorySaver()
graph = builder.compile(checkpointer=memory)
