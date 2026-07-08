import random
import re
from langchain_core.messages import AIMessage, HumanMessage
from app.agent.state import TutorState
from app.agent.tools.question_tools import get_question_by_id

_ANSWER = re.compile(r"([1-4①②③④])번?")
_CIRCLE = {1: "①", 2: "②", 3: "③", 4: "④"}
_CIRCLE_TO_INT = {"①": 1, "②": 2, "③": 3, "④": 4}
_SQL_IN_OPTION = re.compile(r'^\s*(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|MERGE)\b(?!\s*[가-힣])', re.IGNORECASE)


def _format_question(q: dict) -> str:
    """drill_node와 동일한 ①②③④ 형식으로 포맷 (버튼 렌더링 호환)."""
    context = q.get("context", "")
    options = q["options"]

    if isinstance(options, dict):
        opts_list = [(int(k), options[k]) for k in sorted(options.keys(), key=int)]
    else:
        opts_list = [(i + 1, opt) for i, opt in enumerate(options)]

    has_sql = any(_SQL_IN_OPTION.search(text) for _, text in opts_list)

    formatted_opts = []
    for num, text in opts_list:
        circle = _CIRCLE[num]
        if has_sql and _SQL_IN_OPTION.search(text):
            formatted_opts.append(f"**{circle}**\n```sql\n{text}\n```")
        elif has_sql:
            formatted_opts.append(f"**{circle}** {text}")
        else:
            formatted_opts.append(f"{circle} {text}")

    opts_block = "\n\n".join(formatted_opts)

    sections = [f"[{q['category']} / 난이도: {q['difficulty']}]"]
    sections.append("> 오답 복습 중인 문제입니다.")
    if context:
        sections.append(context.replace("\n", "\n\n"))
    sections.append(q['question'])
    sections.append(opts_block)
    sections.append("번호로 답하세요.")
    return "\n\n".join(sections)


def _format_feedback(q: dict, user_answer: int, correct: bool) -> str:
    if correct:
        header = "정답입니다! 오답 목록에서 제거됩니다."
    else:
        correct_circle = _CIRCLE.get(q['answer'], str(q['answer']))
        header = f"아직 틀렸습니다. 정답은 {correct_circle}번입니다."
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

    ans_char = match.group(1)
    user_answer = _CIRCLE_TO_INT.get(ans_char, int(ans_char))
    correct = user_answer == pending["answer"]

    # 정답 시 recent_mistakes, wrong_answer_log에서 제거
    mistakes = list(state.get("recent_mistakes") or [])
    wrong_log = dict(state.get("wrong_answer_log") or {})
    if correct:
        if pending["id"] in mistakes:
            mistakes.remove(pending["id"])
        wrong_log.pop(pending["id"], None)

    return {
        "messages": [AIMessage(content=_format_feedback(pending, user_answer, correct))],
        "pending_question": {},
        "question_history": (state.get("question_history") or []) + [pending["id"]],
        "recent_mistakes": mistakes,
        "wrong_answer_log": wrong_log,
        "last_grade_result": {
            "question_id": pending["id"],
            "category": pending["category"],
            "correct": correct,
            "difficulty": pending["difficulty"],
            "tags": pending.get("tags", []),
        },
    }
