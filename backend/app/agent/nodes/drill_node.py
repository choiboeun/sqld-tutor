import re
from langchain_core.messages import AIMessage, HumanMessage
from app.agent.state import TutorState
from app.agent.tools.question_tools import get_random_question

_ANSWER = re.compile(r"([1-4])번?")

_CATEGORY_ALIASES = {
    "조인": "조인", "join": "조인",
    "서브쿼리": "서브쿼리 & Top N", "subquery": "서브쿼리 & Top N", "top n": "서브쿼리 & Top N",
    "윈도우": "윈도우 함수", "window": "윈도우 함수",
    "group by": "GROUP BY & ORDER BY", "order by": "GROUP BY & ORDER BY",
    "그룹": "GROUP BY & ORDER BY", "having": "GROUP BY & ORDER BY",
    "집합 연산자": "집합 연산자 & 그룹 함수", "그룹 함수": "집합 연산자 & 그룹 함수",
    "rollup": "집합 연산자 & 그룹 함수", "cube": "집합 연산자 & 그룹 함수",
    "함수": "함수", "nvl": "함수", "decode": "함수",
    "select": "SELECT & WHERE", "where": "SELECT & WHERE",
    "관리": "관리 구문", "dcl": "관리 구문", "ddl": "관리 구문", "grant": "관리 구문",
    "모델링": "데이터 모델링 기초", "데이터 모델": "데이터 모델과 SQL",
    "sql 활용": "SQL 활용 기타",
}

_DIFFICULTY_MAP = {
    "쉬운": "하", "쉽게": "하", "쉬워": "하", "쉬운걸로": "하",
    "중간": "중", "보통": "중",
    "어려운": "상", "어렵게": "상", "어려워": "상", "어려운걸로": "상", "어렵": "상", "고난도": "상",
}


def _parse_category(text: str) -> str | None:
    lower = text.lower()
    for alias, category in _CATEGORY_ALIASES.items():
        if alias in lower:
            return category
    return None


def _parse_difficulty(text: str) -> str | None:
    for keyword, diff in _DIFFICULTY_MAP.items():
        if keyword in text:
            return diff
    return None


def _format_question(q: dict) -> str:
    parts = [f"[{q['category']} / 난이도: {q['difficulty']}]"]
    if q.get("context"):
        parts.append(f"\n{q['context']}")
    parts.append(f"\n{q['question']}\n")
    options = q["options"]
    if isinstance(options, dict):
        for key in sorted(options.keys(), key=int):
            parts.append(f"{key}. {options[key]}")
    else:
        for i, opt in enumerate(options, 1):
            parts.append(f"{i}. {opt}")
    parts.append("\n번호로 답하세요.")
    return "\n".join(parts)


def _format_feedback(q: dict, user_answer: int, correct: bool) -> str:
    if correct:
        header = "정답입니다!"
    else:
        header = f"오답입니다. 정답은 {q['answer']}번입니다."
    return f"{header}\n\n해설: {q.get('explanation', '')}"


def drill_node(state: TutorState) -> dict:
    pending = state.get("pending_question") or {}

    if not pending:
        history = state.get("question_history") or []
        last_human = next(
            (m for m in reversed(state["messages"]) if isinstance(m, HumanMessage)), None
        )
        text = last_human.content if last_human else ""
        category = _parse_category(text)
        difficulty = _parse_difficulty(text)

        question = get_random_question(
            exclude_ids=history,
            category=category,
            difficulty=difficulty,
        )
        if not question:
            hint = ""
            if category:
                hint = f" ('{category}' 카테고리"
                if difficulty:
                    hint += f", 난이도 '{difficulty}'"
                hint += ")"
            return {
                "messages": [AIMessage(content=f"조건에 맞는 문제가 없습니다{hint}. 조건을 바꿔보세요.")],
            }

        return {
            "messages": [AIMessage(content=_format_question(question))],
            "pending_question": question,
            "last_category": question["category"],
            "retry_count": 0,
        }

    # 채점
    last_human = next(
        (m for m in reversed(state["messages"]) if isinstance(m, HumanMessage)), None
    )
    match = _ANSWER.search(last_human.content) if last_human else None

    if not match:
        return {"messages": [AIMessage(content="현재 출제된 문제를 먼저 풀어주세요! (1~4번 중 선택)")]}

    user_answer = int(match.group(1))
    correct = user_answer == pending["answer"]

    return {
        "messages": [AIMessage(content=_format_feedback(pending, user_answer, correct))],
        "pending_question": {},
        "question_history": (state.get("question_history") or []) + [pending["id"]],
        "last_grade_result": {
            "question_id": pending["id"],
            "category": pending["category"],
            "correct": correct,
            "difficulty": pending["difficulty"],
        },
    }
