import random
import re
from langchain_core.messages import AIMessage, HumanMessage
from app.agent.state import TutorState
from app.agent.tools.question_tools import get_question_by_id

_ANSWER = re.compile(r"([1-4])번?")


def _format_question(q: dict) -> str:
    parts = [f"[오답 복습 | {q['category']} / 난이도: {q['difficulty']}]"]
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
        header = "정답입니다! 오답 목록에서 제거됩니다."
    else:
        header = f"아직 틀렸습니다. 정답은 {q['answer']}번입니다."
    return f"{header}\n\n해설: {q.get('explanation', '')}"


def review_node(state: TutorState) -> dict:
    pending = state.get("pending_question") or {}

    if not pending:
        mistakes = state.get("recent_mistakes") or []
        if not mistakes:
            return {
                "messages": [AIMessage(content="아직 오답 기록이 없습니다. 먼저 문제를 풀어보세요!")],
            }
        question = get_question_by_id(random.choice(mistakes))
        if not question:
            return {"messages": [AIMessage(content="문제를 불러오는 중 오류가 발생했습니다.")]}

        return {
            "messages": [AIMessage(content=_format_question(question))],
            "pending_question": question,
            "retry_count": 0,
        }

    # 채점
    last_human = next(
        (m for m in reversed(state["messages"]) if isinstance(m, HumanMessage)), None
    )
    match = _ANSWER.search(last_human.content) if last_human else None

    if not match:
        return {"messages": [AIMessage(content=_format_question(pending))]}

    user_answer = int(match.group(1))
    correct = user_answer == pending["answer"]

    # 정답 시 recent_mistakes에서 제거
    mistakes = list(state.get("recent_mistakes") or [])
    if correct and pending["id"] in mistakes:
        mistakes.remove(pending["id"])

    return {
        "messages": [AIMessage(content=_format_feedback(pending, user_answer, correct))],
        "pending_question": {},
        "question_history": (state.get("question_history") or []) + [pending["id"]],
        "recent_mistakes": mistakes,
        "last_grade_result": {
            "question_id": pending["id"],
            "category": pending["category"],
            "correct": correct,
            "difficulty": pending["difficulty"],
        },
    }
