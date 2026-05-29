import re
from langchain_core.messages import AIMessage, HumanMessage
from app.agent.state import TutorState
from app.agent.tools.question_tools import get_random_question

_ANSWER = re.compile(r"([1-4])번?")


def _format_question(q: dict) -> str:
    parts = [f"[{q['category']} / 난이도: {q['difficulty']}]"]
    if q.get("context"):
        parts.append(f"\n{q['context']}")
    parts.append(f"\n{q['question']}\n")
    for i, opt in enumerate(q["options"], 1):
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
        question = get_random_question(exclude_ids=history)
        if not question:
            return {
                "messages": [AIMessage(content="모든 문제를 다 풀었습니다! '오답 복습'으로 틀린 문제를 다시 풀어보세요.")],
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
        return {"messages": [AIMessage(content="1~4 중 번호로 답해주세요.")]}

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
