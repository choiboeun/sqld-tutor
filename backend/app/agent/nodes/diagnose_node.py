from langchain_core.messages import AIMessage
from app.agent.state import TutorState

_CATEGORIES = [
    "데이터 모델링 기초", "데이터 모델과 SQL", "SELECT & WHERE",
    "함수", "GROUP BY & ORDER BY", "조인",
    "서브쿼리 & Top N", "집합 연산자 & 그룹 함수",
    "윈도우 함수", "SQL 활용 기타", "관리 구문",
]


def diagnose_node(state: TutorState) -> dict:
    accuracy = state.get("accuracy_by_category") or {}
    attempts = state.get("attempts_by_category") or {}
    is_initial = state.get("is_diagnostic", False)

    attempted = [
        (cat, accuracy.get(cat, 0.0), attempts.get(cat, 0))
        for cat in _CATEGORIES
        if attempts.get(cat, 0) > 0
    ]

    if not attempted:
        return {
            "messages": [AIMessage(content="아직 풀이 데이터가 없습니다. 먼저 문제를 몇 개 풀어주세요!")],
            "is_diagnostic": False,
        }

    total = state.get("total_answered") or 0
    streak = state.get("streak") or 0
    not_attempted = [cat for cat in _CATEGORIES if attempts.get(cat, 0) == 0]

    sorted_cats = sorted(attempted, key=lambda x: x[1])
    weak = [(cat, acc, cnt) for cat, acc, cnt in sorted_cats if acc < 0.6]
    strong = [(cat, acc, cnt) for cat, acc, cnt in reversed(sorted_cats) if acc >= 0.6]

    if is_initial:
        header = f"**진단 완료!** 8문제로 현재 실력을 파악했어요. 아래 결과를 바탕으로 학습을 시작해봐요."
    else:
        header = f"**학습 현황** — 총 {total}문제 | 연속 정답 {streak}개 | {len(attempted)}/11 카테고리 학습"

    lines = [
        header,
        "",
        "---",
    ]

    if weak:
        lines += ["", "**취약 카테고리** (정답률 60% 미만)", ""]
        lines += ["| 카테고리 | 정답률 | 풀이 수 |", "|---|:---:|:---:|"]
        low_sample = False
        for cat, acc, cnt in weak[:3]:
            note = "" if is_initial else (" ⚠️" if cnt < 5 else "")
            lines.append(f"| {cat} | **{acc:.0%}** | {cnt}문제{note} |")
            if cnt < 5:
                low_sample = True
        if low_sample and not is_initial:
            lines.append("\n> ⚠️ 5문제 미만은 데이터가 적어 신뢰도가 낮습니다. 더 풀어보세요!")

    if strong:
        lines += ["", "**잘 하고 있는 카테고리**", ""]
        lines += ["| 카테고리 | 정답률 | 풀이 수 |", "|---|:---:|:---:|"]
        for cat, acc, cnt in strong[:3]:
            lines.append(f"| {cat} | {acc:.0%} | {cnt}문제 |")

    if not_attempted:
        preview = ", ".join(not_attempted[:4])
        suffix = f" 외 {len(not_attempted) - 4}개" if len(not_attempted) > 4 else ""
        lines += ["", f"**미학습** ({len(not_attempted)}개): {preview}{suffix}"]

    if weak:
        lines += ["", "---", f"> '{weak[0][0]}' 관련 문제를 집중해서 풀어보세요."]

    if is_initial:
        lines += ["", "'문제 줘'라고 입력하면 약점 카테고리 위주로 학습을 시작합니다!"]

    return {"messages": [AIMessage(content="\n".join(lines))], "is_diagnostic": False}
