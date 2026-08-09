import random
import re
from langchain_core.messages import AIMessage, HumanMessage
from app.agent.state import TutorState
from app.agent.tools.question_tools import get_question_by_id
from app.agent.nodes.drill_node import _try_result_table, _MARKDOWN_TABLE_RE

_ANSWER = re.compile(r"^\s*([1-4①②③④])번?[\s.,]*$")
_CIRCLE = {1: "①", 2: "②", 3: "③", 4: "④"}
_CIRCLE_TO_INT = {"①": 1, "②": 2, "③": 3, "④": 4}
_SQL_IN_OPTION = re.compile(r'^\s*(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|MERGE)\b(?!\s*[가-힣])', re.IGNORECASE)
_HAS_KOREAN = re.compile(r'[가-힣]')
_SQL_LABEL_RE = re.compile(r'^\[SQL(\d+)\]\s+(.+)$', re.MULTILINE)


def _format_sql_labels(ctx: str) -> str:
    """[SQL1] SELECT... 패턴을 **[SQL1]** + 코드 블록으로 변환 (drill_node와 동일)."""
    def replace(m: re.Match) -> str:
        label = m.group(1)
        sql = m.group(2).strip()
        return f'**[SQL{label}]**\n```sql\n{sql}\n```'
    return _SQL_LABEL_RE.sub(replace, ctx)


def _normalize_context(ctx: str) -> str:
    """단일 \n을 \n\n으로 변환하되, 마크다운 테이블 행 사이와 코드 블록 내부는 유지."""
    lines = ctx.split('\n')
    out = []
    in_code = False
    for i, line in enumerate(lines):
        out.append(line)
        if line.strip().startswith('```'):
            in_code = not in_code
        if i < len(lines) - 1 and not in_code:
            is_table = line.strip().startswith('|')
            next_is_table = lines[i + 1].strip().startswith('|')
            if not (is_table and next_is_table):
                out.append('')
    return '\n'.join(out)


def _format_question(q: dict) -> str:
    """drill_node와 동일한 ①②③④ 형식으로 포맷 (버튼 렌더링 호환)."""
    context = q.get("context", "")
    options = q["options"]

    if isinstance(options, dict):
        opts_list = [(str(k), options[k]) for k in sorted(options.keys(), key=int)]
    else:
        opts_list = [(str(i + 1), opt) for i, opt in enumerate(options)]

    opt_data = []
    has_block = False
    for key, opt_text in opts_list:
        result = _try_result_table(opt_text, context)
        if result is not None:
            fmt, content = "result_table", result
            has_block = True
        elif _SQL_IN_OPTION.search(opt_text) and not _HAS_KOREAN.search(opt_text):
            fmt, content = "sql_block", opt_text
            has_block = True
        elif _MARKDOWN_TABLE_RE.search(opt_text):
            fmt, content = "md_table", opt_text
            has_block = True
        else:
            fmt, content = "plain", opt_text
        opt_data.append((fmt, key, content))

    formatted_opts = []
    for fmt, key, content in opt_data:
        circle = _CIRCLE[int(key)]
        if not has_block:
            formatted_opts.append(f"{circle} {content}")
        elif fmt == "result_table":
            table_str, suffix_str = content
            label = f"**{circle}** {suffix_str}" if suffix_str else f"**{circle}**"
            formatted_opts.append(f"{label}\n{table_str}")
        elif fmt == "sql_block":
            formatted_opts.append(f"**{circle}**\n```sql\n{content}\n```")
        elif fmt == "md_table":
            formatted_opts.append(f"**{circle}**\n{content}")
        else:
            formatted_opts.append(f"**{circle}** {content}")

    opts_block = "\n\n".join(formatted_opts)

    sections = [f"[{q['category']} / 난이도: {q['difficulty']}]"]
    sections.append("> 오답 복습 중인 문제입니다.")
    if context:
        sections.append(_normalize_context(_format_sql_labels(context)))
    sections.append(q['question'])
    sections.append(opts_block)
    sections.append("번호로 답하세요.")
    return "\n\n".join(sections)


def _format_feedback(q: dict, user_answer: int, correct: bool) -> str:
    if correct:
        header = "정답이에요! 오답 목록에서 제거돼요."
    else:
        correct_circle = _CIRCLE.get(q['answer'], str(q['answer']))
        header = f"아직 틀렸어요. 정답은 {correct_circle}번이에요."
    return f"{header}\n\n---\n\n**해설**\n\n{q.get('explanation', '')}"


def review_node(state: TutorState) -> dict:
    pending = state.get("pending_question") or {}

    if not pending:
        wrong_log = state.get("wrong_answer_log") or {}
        if not wrong_log:
            return {
                "messages": [AIMessage(content="아직 오답 기록이 없어요. 먼저 문제를 풀어보세요!")],
            }
        history = state.get("question_history") or []
        recent = set(history[-3:])
        candidates = [q for q in wrong_log.keys() if q not in recent] or list(wrong_log.keys())
        question = get_question_by_id(random.choice(candidates))
        if not question:
            return {"messages": [AIMessage(content="문제를 불러오는 중 오류가 발생했어요.")]}

        return {
            "messages": [AIMessage(content=_format_question(question))],
            "pending_question": question,
            "retry_count": 0,
        }

    # 채점
    last_human = next(
        (m for m in reversed(state["messages"]) if isinstance(m, HumanMessage)), None
    )
    match = _ANSWER.match(last_human.content) if last_human else None

    if not match:
        note = "\n\n> 1~4번 중 하나를 선택해주세요."
        return {"messages": [AIMessage(content=_format_question(pending) + note)]}

    ans_char = match.group(1)
    user_answer = _CIRCLE_TO_INT.get(ans_char, int(ans_char))
    correct = user_answer == pending["answer"]

    # 정답 시 recent_mistakes, wrong_answer_log에서 제거
    mistakes = list(state.get("recent_mistakes") or [])
    wrong_log = dict(state.get("wrong_answer_log") or {})
    history = list(state.get("question_history") or [])
    if correct:
        if pending["id"] in mistakes:
            mistakes.remove(pending["id"])
        wrong_log.pop(pending["id"], None)
        # 풀었던 목록에서도 제거 → 랜덤 출제 풀로 복귀
        history = [qid for qid in history if qid != pending["id"]]
    else:
        history = history + [pending["id"]]

    return {
        "messages": [AIMessage(content=_format_feedback(pending, user_answer, correct))],
        "pending_question": {},
        "question_history": history,
        "recent_mistakes": mistakes,
        "wrong_answer_log": wrong_log,
        "last_grade_result": {
            "question_id": pending["id"],
            "category": pending["category"],
            "correct": correct,
            "difficulty": pending["difficulty"],
            "tags": pending.get("tags", []),
            "student_answer": user_answer,
        },
        "last_answered_question": pending,
        "follow_up_mode": True,
    }
