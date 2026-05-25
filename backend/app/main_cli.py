import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

from langchain_core.messages import HumanMessage
from app.agent.graph import graph

THREAD_ID = "test-session-1"
config = {"configurable": {"thread_id": THREAD_ID}}


def get_text(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for c in content:
            if isinstance(c, dict) and c.get("type") == "text":
                parts.append(c["text"])
        return "".join(parts) if parts else str(content)
    return str(content)


def chat(user_input: str):
    result = graph.invoke(
        {"messages": [HumanMessage(content=user_input)], "current_mode": "drill", "pending_question": {}},
        config=config,
    )
    last_message = result["messages"][-1]
    print(f"\nAI: {get_text(last_message.content)}\n")


if __name__ == "__main__":
    print("SQLD AI 튜터 CLI (종료: 'quit')\n")
    while True:
        user_input = input("나: ").strip()
        if user_input.lower() == "quit":
            break
        if not user_input:
            continue
        chat(user_input)
