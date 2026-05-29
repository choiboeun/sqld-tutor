import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

from langchain_core.messages import HumanMessage
from app.agent.graph import graph

THREAD_ID = "test-session-1"
config = {"configurable": {"thread_id": THREAD_ID}}

_INITIAL_STATE = {
    "current_mode": "chat",
    "pending_question": {},
    "question_history": [],
    "last_category": None,
    "student_level": "beginner",
    "target_score": 60,
    "difficulty_preference": "mix",
    "accuracy_by_category": {
        "데이터 모델링 기초": 0.0,
        "데이터 모델과 SQL": 0.0,
        "SELECT & WHERE": 0.0,
        "함수": 0.0,
        "GROUP BY & ORDER BY": 0.0,
        "조인": 0.0,
        "서브쿼리 & Top N": 0.0,
        "집합 연산자 & 그룹 함수": 0.0,
        "윈도우 함수": 0.0,
        "SQL 활용 기타": 0.0,
        "관리 구문": 0.0,
    },
    "attempts_by_category": {},
    "recent_mistakes": [],
    "total_answered": 0,
    "session_question_count": 0,
    "streak": 0,
    "consecutive_wrong": 0,
    "retry_count": 0,
    "last_grade_result": None,
}

_initialized = False


def get_text(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = [c["text"] for c in content if isinstance(c, dict) and c.get("type") == "text"]
        return "".join(parts) if parts else str(content)
    return str(content)


def chat(user_input: str):
    global _initialized
    if not _initialized:
        state_input = {**_INITIAL_STATE, "messages": [HumanMessage(content=user_input)]}
        _initialized = True
    else:
        state_input = {"messages": [HumanMessage(content=user_input)]}

    result = graph.invoke(state_input, config=config)
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
