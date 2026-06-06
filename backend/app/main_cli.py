import os
import sys
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

from langchain_core.messages import HumanMessage
from app.agent.graph import graph

# python3 -m app.main_cli [thread_id]  —  인자 없으면 기본값 사용
THREAD_ID = sys.argv[1] if len(sys.argv) > 1 else "session-default"
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
    "suggest_category_switch": False,
    "last_explained_category": None,
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
        prev_count = 0
    else:
        prev_count = len(graph.get_state(config).values.get("messages", []))
        state_input = {"messages": [HumanMessage(content=user_input)]}

    result = graph.invoke(state_input, config=config)

    # 이번 턴에 새로 추가된 AI 메시지를 순서대로 모두 출력
    from langchain_core.messages import AIMessage
    new_messages = result["messages"][prev_count + 1:]  # +1: 방금 입력한 HumanMessage 제외
    ai_messages = [m for m in new_messages if isinstance(m, AIMessage) and get_text(m.content)]
    for msg in ai_messages:
        print(f"\nAI: {get_text(msg.content)}\n")


if __name__ == "__main__":
    print(f"SQLD AI 튜터 CLI  |  세션: {THREAD_ID}  (종료: 'quit')\n")
    while True:
        user_input = input("나: ").strip()
        if user_input.lower() == "quit":
            break
        if not user_input:
            continue
        chat(user_input)
