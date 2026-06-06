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

    attempted = [
        (cat, accuracy.get(cat, 0.0), attempts.get(cat, 0))
        for cat in _CATEGORIES
        if attempts.get(cat, 0) > 0
    ]

    if not attempted:
        return {
            "messages": [AIMessage(content="아직 풀이 데이터가 없습니다. 먼저 문제를 몇 개 풀어주세요!")]
        }

    total = state.get("total_answered") or 0
    streak = state.get("streak") or 0
    not_attempted = [cat for cat in _CATEGORIES if attempts.get(cat, 0) == 0]

    sorted_cats = sorted(attempted, key=lambda x: x[1])
    weak = [(cat, acc, cnt) for cat, acc, cnt in sorted_cats if acc < 0.6]
    strong = [(cat, acc, cnt) for cat, acc, cnt in reversed(sorted_cats) if acc >= 0.6]

    lines = [
        f"**학습 현황** — 총 {total}문제 | 연속 정답 {streak}개 | {len(attempted)}/11 카테고리 학습",
        "",
        "---",
    ]

    if weak:
        lines += ["", "**취약 카테고리** (정답률 60% 미만)", ""]
        lines += ["| 카테고리 | 정답률 | 풀이 수 |", "|---|:---:|:---:|"]
        for cat, acc, cnt in weak[:3]:
            lines.append(f"| {cat} | **{acc:.0%}** | {cnt}문제 |")

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

    return {"messages": [AIMessage(content="\n".join(lines))]}
