import random
import re
from langchain_core.messages import AIMessage, HumanMessage
from app.agent.state import TutorState
from app.agent.tools.question_tools import get_question_by_id

_ANSWER = re.compile(r"([1-4①②③④])번?")
_CIRCLE = {1: "①", 2: "②", 3: "③", 4: "④"}
_CIRCLE_TO_INT = {"①": 1, "②": 2, "③": 3, "④": 4}


def _format_question(q: dict) -> str:
    header = f"[오답 복습 | {q['category']} / 난이도: {q['difficulty']}]"
    body_parts = [header]
    if q.get("context"):
        body_parts.append(q["context"])

    options = q["options"]
    if isinstance(options, dict):
        opts = [f"{_CIRCLE[int(k)]} {options[k]}" for k in sorted(options.keys(), key=int)]
    else:
        opts = [f"{_CIRCLE[i]} {opt}" for i, opt in enumerate(options, 1)]

    body_parts.append(q["question"] + "\n\n" + "\n\n".join(opts))
    body_parts.append("번호로 답하세요.")
    return "\n\n".join(body_parts)


def _format_feedback(q: dict, user_answer: int, correct: bool) -> str:
    correct_circle = _CIRCLE.get(q["answer"], str(q["answer"]))
    if correct:
        return "정답입니다! 오답 목록에서 제거됩니다."
    return f"아직 틀렸습니다. 정답은 {correct_circle}번입니다.\n\n해설: {q.get('explanation', '')}"


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

    # 다중 입력 방지
    if last_human:
        all_digits = re.findall(r"[1-4①②③④]", last_human.content)
        if len(all_digits) > 1:
            return {"messages": [AIMessage(content="1~4 중 하나만 입력해주세요.\n\n" + _format_question(pending))]}

    ans_char = match.group(1)
    user_answer = _CIRCLE_TO_INT.get(ans_char, int(ans_char))
    correct = user_answer == pending["answer"]

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
