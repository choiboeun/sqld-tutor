import re
import random
from langchain_core.messages import AIMessage, HumanMessage
from app.agent.state import TutorState
from app.agent.tools.question_tools import get_random_question, get_available_categories

_ANSWER = re.compile(r"^\s*([1-4①②③④])번?[\s.,]*$")
_GIVE_UP = re.compile(r"모르겠|몰라|포기|모름")
_CIRCLE = {1: "①", 2: "②", 3: "③", 4: "④"}
_CIRCLE_TO_INT = {"①": 1, "②": 2, "③": 3, "④": 4}


_PARTICLE = re.compile(r'[의은이가을를에서도]$')


def _extract_select_cols(context: str) -> list[str]:
    """SELECT 절에서 컬럼명(또는 AS 별칭)을 추출한다. 테이블 별칭(E.COL → COL) 처리."""
    m = re.search(r'SELECT\s+(.*?)\s+FROM', context, re.IGNORECASE | re.DOTALL)
    if not m:
        return []
    cols = []
    for col in m.group(1).split(','):
        col = col.strip()
        alias = re.search(r'\bAS\s+(\w+)\s*$', col, re.IGNORECASE)
        if alias:
            cols.append(alias.group(1))
        else:
            cols.append(col.split()[-1].split('.')[-1])
    return cols


def _pick_diverse_category(state: TutorState, available: list[str]) -> str | None:
    """약점 카테고리를 우선 선택한다. 정답률 낮을수록 더 자주 출제."""
    if not available:
        return None
    attempts = state.get("attempts_by_category") or {}
    accuracy = state.get("accuracy_by_category") or {}
    last_cat = state.get("last_category")

    # 한 번도 안 푼 카테고리 우선 (직전 카테고리 제외)
    not_tried = [c for c in available if attempts.get(c, 0) == 0 and c != last_cat]
    if not_tried:
        return random.choice(not_tried)

    # 모두 시도했으면 정답률 낮은 카테고리에 높은 가중치
    # (1 - acc)^2 + 0.1 → 정답률 0%는 1.1, 50%는 0.35, 100%는 0.1
    candidates = [c for c in available if c != last_cat] or available
    weights = [(1.0 - accuracy.get(c, 0.5)) ** 2 + 0.1 for c in candidates]
    return random.choices(candidates, weights=weights, k=1)[0]


# 보기가 SQL 구문 전용일 때만 코드 블록 처리 (한글 설명이 섞인 경우 제외)
_SQL_IN_OPTION = re.compile(r'^\s*(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|MERGE)\b(?!\s*[가-힣])', re.IGNORECASE)
_HAS_KOREAN = re.compile(r'[가-힣]')
_MARKDOWN_TABLE_RE = re.compile(r'^\s*\|.+\|', re.MULTILINE)
# [SQL1] SELECT...\n[SQL2] SELECT... 패턴 감지
_SQL_LABEL_RE = re.compile(r'^\[SQL(\d+)\]\s+(.+)$', re.MULTILINE)


def _format_sql_labels(ctx: str) -> str:
    """[SQL1] SELECT... 패턴을 **[SQL1]** + 코드 블록으로 변환."""
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


def _try_result_table(text: str, context: str = "") -> tuple | None:
    """결과 패턴을 (테이블 문자열, suffix) 튜플로 변환한다. 변환 불가시 None."""
    t = text.strip()

    # Pattern 1a: 텍스트 앞부분에 2개 이상 "이름-값" 쌍 (기존 패턴)
    m = re.match(r'^((?:[가-힣\w]+-[가-힣\w]+,\s*)+[가-힣\w]+-[가-힣\w]+)(.*)', t)
    if m:
        raw_items = re.findall(r'([가-힣\w]+)-([가-힣\w]+)', m.group(1))
        items = [(n, _PARTICLE.sub('', v)) for n, v in raw_items]
        suffix = m.group(2).strip()
    else:
        # Pattern 1b: 텍스트 어느 위치에나 한국어 이름-값 쌍 (1개 이상)
        # 예: "관리자 정보가 있으므로 이과장-김부장 1건만 조회된다."
        kor_pairs = re.findall(r'([가-힣][가-힣\w]*)-([가-힣][가-힣\w]*)', t)
        if len(kor_pairs) >= 2:
            items = [(n, _PARTICLE.sub('', v)) for n, v in kor_pairs]
            # 쌍 부분 제거 후 나머지 텍스트를 suffix로
            suffix = re.sub(r'[가-힣][가-힣\w]*-[가-힣][가-힣\w]*,?\s*', '', t).strip()
        else:
            # Pattern 2: "단어 숫자, 단어 숫자..." (공백 구분, GROUP BY 결과 등)
            m = re.match(
                r'^((?:[A-Z가-힣][A-Z가-힣\w]*\s+\d+,\s*)+[A-Z가-힣][A-Z가-힣\w]*\s+\d+)(.*)',
                t
            )
            if not m:
                return None
            items = re.findall(r'([A-Z가-힣][A-Z가-힣\w]*)\s+(\d+)', m.group(1))
            suffix = m.group(2).strip()

    if not items:
        return None

    headers = _extract_select_cols(context)
    h1 = headers[0] if headers else "이름"
    h2 = headers[1] if len(headers) > 1 else "값"

    rows = [f"| {h1} | {h2} |", "|---|---|"]
    for name, val in items:
        rows.append(f"| {name} | {val} |")

    table = "\n".join(rows)
    return (table, suffix)  # (테이블 문자열, 뒤에 붙는 설명 텍스트)

_CATEGORY_ALIASES = {
    # ── 데이터 모델링 기초 (반정규화는 정규화보다 먼저 검사) ─────────────
    "반정규화": "데이터 모델과 SQL",
    "모델링": "데이터 모델링 기초",
    "정규화": "데이터 모델링 기초",
    "erd": "데이터 모델링 기초",
    "엔티티": "데이터 모델링 기초",
    "식별자": "데이터 모델링 기초",
    # ── 데이터 모델링 기초 추가 alias (데이터 모델보다 길어야 먼저 매칭됨)
    "데이터 모델링": "데이터 모델링 기초",
    # ── 데이터 모델과 SQL ─────────────────────────────────────────────
    "데이터 모델과 sql": "데이터 모델과 SQL",
    "데이터 모델": "데이터 모델과 SQL",
    "모델과 sql": "데이터 모델과 SQL",
    "모델": "데이터 모델과 SQL",
    # ── SELECT & WHERE ────────────────────────────────────────────────
    "select": "SELECT & WHERE",
    "where": "SELECT & WHERE",
    "distinct": "SELECT & WHERE",
    "between": "SELECT & WHERE",
    "like": "SELECT & WHERE",
    # ── 함수 ─────────────────────────────────────────────────────────
    "함수": "함수",
    "nvl": "함수",
    "decode": "함수",
    "round": "함수",
    "trunc": "함수",
    "to_char": "함수",
    "to_date": "함수",
    "substr": "함수",
    "instr": "함수",
    "sysdate": "함수",
    # ── GROUP BY & ORDER BY ───────────────────────────────────────────
    "group by": "GROUP BY & ORDER BY",
    "order by": "GROUP BY & ORDER BY",
    "그룹": "GROUP BY & ORDER BY",
    "having": "GROUP BY & ORDER BY",
    "정렬": "GROUP BY & ORDER BY",
    # ── 조인 ─────────────────────────────────────────────────────────
    "조인": "조인",
    "join": "조인",
    # ── 서브쿼리 & Top N (인라인 뷰는 뷰보다 먼저 검사) ────────────────
    "인라인 뷰": "서브쿼리 & Top N",
    "inline view": "서브쿼리 & Top N",
    "서브쿼리": "서브쿼리 & Top N",
    "subquery": "서브쿼리 & Top N",
    "top n": "서브쿼리 & Top N",
    "rownum": "서브쿼리 & Top N",
    "스칼라": "서브쿼리 & Top N",
    # ── 집합 연산자 & 그룹 함수 ──────────────────────────────────────
    "집합 연산자": "집합 연산자 & 그룹 함수",
    "그룹 함수": "집합 연산자 & 그룹 함수",
    "rollup": "집합 연산자 & 그룹 함수",
    "cube": "집합 연산자 & 그룹 함수",
    "grouping sets": "집합 연산자 & 그룹 함수",
    "union": "집합 연산자 & 그룹 함수",
    "intersect": "집합 연산자 & 그룹 함수",
    "minus": "집합 연산자 & 그룹 함수",
    # ── 윈도우 함수 (dense_rank는 rank보다 먼저 검사) ──────────────────
    "윈도우": "윈도우 함수",
    "window": "윈도우 함수",
    "partition by": "윈도우 함수",
    "row_number": "윈도우 함수",
    "dense_rank": "윈도우 함수",
    "rank": "윈도우 함수",
    "ntile": "윈도우 함수",
    "lag": "윈도우 함수",
    "lead": "윈도우 함수",
    # ── SQL 활용 기타 ─────────────────────────────────────────────────
    "sql 활용": "SQL 활용 기타",
    "계층형 질의": "SQL 활용 기타",
    "계층형": "SQL 활용 기타",
    "connect by": "SQL 활용 기타",
    "pivot": "SQL 활용 기타",
    "merge": "SQL 활용 기타",
    "정규표현식": "SQL 활용 기타",
    "regexp": "SQL 활용 기타",
    # ── 관리 구문 (view는 인라인 뷰보다 늦게 검사) ─────────────────────
    "관리": "관리 구문",
    "ddl": "관리 구문",
    "dcl": "관리 구문",
    "dml": "관리 구문",
    "tcl": "관리 구문",
    "grant": "관리 구문",
    "트랜잭션": "관리 구문",
    "commit": "관리 구문",
    "rollback": "관리 구문",
    "인덱스": "관리 구문",
    "index": "관리 구문",
    "시퀀스": "관리 구문",
    "sequence": "관리 구문",
    "뷰": "관리 구문",
    "view": "관리 구문",
}

_DIFFICULTY_MAP = {
    "쉬운": "하", "쉽게": "하", "쉬워": "하", "쉬운걸로": "하",
    "중간": "중", "보통": "중",
    "어려운": "상", "어렵게": "상", "어려워": "상", "어려운걸로": "상", "어렵": "상", "고난도": "상", "킬러": "상", "최고난도": "상",
}

# target_score → 난이도 가중치 (진단 중 or 해당 카테고리 데이터 없을 때 사용)
_TARGET_DIFF_WEIGHTS: dict[int, tuple[list, list]] = {
    60: (["하", "중"],       [0.5, 0.5]),
    70: (["하", "중", "상"], [0.2, 0.6, 0.2]),
    80: (["중", "상"],       [0.5, 0.5]),
    90: (["중", "상"],       [0.2, 0.8]),
}


_DIFF_LEVELS = ["하", "중", "상"]


def _auto_difficulty(state: TutorState, category: str | None, is_diagnostic: bool) -> str:
    """사용자가 난이도를 명시하지 않았을 때 자동 결정.
    - 진단 중: target_score 가중치 랜덤
    - 진단 후: 카테고리 정답률 기반 → streak/연속오답으로 미세 조정
    """
    if not is_diagnostic and category:
        attempts = (state.get("attempts_by_category") or {}).get(category, 0)
        if attempts >= 1:
            acc = (state.get("accuracy_by_category") or {}).get(category, 0.5)
            if acc >= 0.7:
                base = "상"
            elif acc >= 0.4:
                base = "중"
            else:
                base = "하"

            # streak/연속오답으로 한 단계 조정
            streak = state.get("streak") or 0
            consec_wrong = state.get("consecutive_wrong") or 0
            idx = _DIFF_LEVELS.index(base)
            if streak >= 3:
                idx = min(idx + 1, 2)   # 연속 3정답 → 한 단계 올림
            elif consec_wrong >= 2:
                idx = max(idx - 1, 0)   # 연속 2오답 → 한 단계 내림
            return _DIFF_LEVELS[idx]

    target = state.get("target_score") or 70
    key = min(_TARGET_DIFF_WEIGHTS, key=lambda k: abs(k - target))
    diffs, weights = _TARGET_DIFF_WEIGHTS[key]
    return random.choices(diffs, weights=weights)[0]


def _parse_category(text: str) -> str | None:
    lower = text.lower()
    # 긴 alias부터 체크 — 짧은 alias가 긴 개념명에 오매칭 되는 걸 방지
    # 예) "윈도우 함수 문제 줘"에서 "함수"(2) 대신 "윈도우"(3)가 먼저 매칭
    for alias, category in sorted(_CATEGORY_ALIASES.items(), key=lambda x: len(x[0]), reverse=True):
        if alias in lower:
            return category
    return None


def _parse_difficulty(text: str) -> str | None:
    for keyword, diff in _DIFFICULTY_MAP.items():
        if keyword in text:
            return diff
    return None


def _format_question(q: dict) -> str:
    context = q.get("context", "")
    options = q["options"]

    if isinstance(options, dict):
        opts_list = [(key, options[key]) for key in sorted(options.keys(), key=int)]
    else:
        opts_list = [(str(i), opt) for i, opt in enumerate(options, 1)]

    # 1차: 각 옵션의 포맷 타입과 변환된 내용 결정
    opt_data = []  # (fmt, key, content)
    has_block = False
    for key, opt_text in opts_list:
        result = _try_result_table(opt_text, context)
        if result is not None:
            table_str, suffix_str = result
            fmt, content = "result_table", (table_str, suffix_str)
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

    # 모든 보기를 ①②③④ 원형 번호로 통일 (context 번호목록과 시각적 구분)
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
        else:  # plain
            formatted_opts.append(f"**{circle}** {content}")

    opts_block = "\n\n".join(formatted_opts)

    sections = [f"[{q['category']} / 난이도: {q['difficulty']}]"]
    if context:
        sections.append(_normalize_context(_format_sql_labels(context)))
    if q.get("image"):
        sections.append(f"![다이어그램](/diagrams/{q['image']})")
    sections.append(q['question'])
    sections.append(opts_block)
    sections.append("번호로 답하세요.")
    return "\n\n".join(sections)


def _format_feedback(q: dict, user_answer: int, correct: bool) -> str:
    if correct:
        header = "정답입니다!"
    else:
        correct_circle = _CIRCLE.get(q['answer'], str(q['answer']))
        header = f"오답입니다. 정답은 {correct_circle}번입니다."
    return f"{header}\n\n---\n\n**해설**\n\n{q.get('explanation', '')}"


def drill_node(state: TutorState) -> dict:
    pending = state.get("pending_question") or {}

    if not pending:
        history = list(
            set(state.get("question_history") or []) |
            set((state.get("wrong_answer_log") or {}).keys())
        )
        last_human = next(
            (m for m in reversed(state["messages"]) if isinstance(m, HumanMessage)), None
        )
        text = last_human.content if last_human else ""
        category = _parse_category(text)
        user_difficulty = _parse_difficulty(text)  # 사용자가 명시한 난이도 (없으면 None)
        difficulty = user_difficulty

        is_diagnostic = state.get("is_diagnostic", False)
        diag_count = 0
        if is_diagnostic:
            diag_count = state.get("diagnostic_question_count") or 0
        diagnostic_intro = f"**{diag_count + 1}/8**\n\n" if is_diagnostic else ""

        avoid = state.get("last_category") if state.get("suggest_category_switch") else None

        if category:
            if not difficulty:
                difficulty = _auto_difficulty(state, category, is_diagnostic)
            question = get_random_question(
                exclude_ids=history,
                category=category,
                difficulty=difficulty,
                avoid_category=avoid,
            )
            # 난이도를 자동 선택했는데 해당 카테고리에 해당 난이도 문제가 없으면 난이도 제거 후 재시도
            if not question and not user_difficulty:
                question = get_random_question(
                    exclude_ids=history,
                    category=category,
                    avoid_category=avoid,
                )
        else:
            # 사용자가 카테고리 미지정: 덜 풀린 카테고리 우선 선택
            avail_cats = get_available_categories(exclude_ids=history)
            preferred = _pick_diverse_category(state, avail_cats)
            if not difficulty:
                difficulty = _auto_difficulty(state, preferred, is_diagnostic)
            question = get_random_question(
                exclude_ids=history,
                category=preferred,
                difficulty=difficulty,
            )
            # 선택한 카테고리에 문제가 남아 있지 않으면 전체에서 선택
            if not question:
                difficulty = _auto_difficulty(state, None, is_diagnostic)
                question = get_random_question(
                    exclude_ids=history,
                    difficulty=difficulty,
                    avoid_category=avoid,
                )
        if not question:
            hint = ""
            if category:
                hint = f" ('{category}' 카테고리"
                if difficulty:
                    hint += f", 난이도 '{difficulty}'"
                hint += ")"
            return {
                "messages": [AIMessage(content=f"조건에 맞는 문제가 없어요{hint}. 조건을 바꿔보세요.")],
                "suggest_category_switch": False,
            }

        if is_diagnostic:
            question["_diag_seq"] = diag_count + 1
            question["_is_diagnostic"] = True  # 체크포인트 유실 시 클라이언트 캐시로 복원용
        return {
            "messages": [AIMessage(content=diagnostic_intro + _format_question(question))],
            "pending_question": question,
            "last_category": question["category"],
            "retry_count": 0,
            "suggest_category_switch": False,
        }

    # 채점
    last_human = next(
        (m for m in reversed(state["messages"]) if isinstance(m, HumanMessage)), None
    )
    match = _ANSWER.match(last_human.content) if last_human else None

    # 다중 번호 입력 감지 (예: "2 2 3 4", "1 3")
    if match and last_human:
        all_digits = re.findall(r"[1-4①②③④]", last_human.content)
        if len(all_digits) > 1:
            diag_seq = pending.get("_diag_seq")
            diag_prefix = f"**{diag_seq}/8**\n\n" if diag_seq else ""
            note = "\n\n> 1~4 중 하나만 입력해주세요 (예: 2 또는 2번)."
            return {"messages": [AIMessage(content=diag_prefix + _format_question(pending) + note)]}

    if not match:
        last_text = (last_human.content or "").strip()
        diag_seq = pending.get("_diag_seq")
        diag_prefix = f"**{diag_seq}/8**\n\n" if diag_seq else ""

        if _GIVE_UP.search(last_text):
            if state.get("is_diagnostic"):
                note = "\n\n> 💡 정확하지 않아도 괜찮아요! 현재 실력 파악이 목적이니 1~4번 중 하나 골라보세요 :)"
                return {"messages": [AIMessage(content=diag_prefix + _format_question(pending) + note)]}
            else:
                # 일반 학습 중: 찍기 유도 — 개념 미리 알려주지 않고 시도 유도
                note = "\n\n> 모르겠다면 일단 1~4번 중 하나를 찍어보세요! 틀려도 괜찮아요, 풀고 나서 해설로 배울 수 있어요."
                return {"messages": [AIMessage(content=diag_prefix + _format_question(pending) + note)]}

        if last_text and last_text[0].isdigit():
            note = "\n\n> 1~4 사이의 번호로 답해주세요."
        else:
            note = "\n\n> 모르겠다면 일단 1~4번 중 하나를 찍어보세요! 틀려도 괜찮아요, 풀고 나서 해설로 배울 수 있어요."
        return {"messages": [AIMessage(content=diag_prefix + _format_question(pending) + note)]}

    ans_char = match.group(1)
    user_answer = _CIRCLE_TO_INT.get(ans_char, int(ans_char))
    correct = user_answer == pending.get("answer")

    return {
        "messages": [AIMessage(content=_format_feedback(pending, user_answer, correct))],
        "pending_question": {},
        "question_history": (state.get("question_history") or []) + [pending["id"]],
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
