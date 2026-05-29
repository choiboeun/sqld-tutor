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
    mistakes_count = len(state.get("recent_mistakes") or [])

    lines = [f"학습 현황 (총 {total}문제 풀이)", ""]

    sorted_cats = sorted(attempted, key=lambda x: x[1])

    lines.append("카테고리별 정답률:")
    for cat, acc, cnt in sorted_cats:
        filled = int(acc * 10)
        bar = "█" * filled + "░" * (10 - filled)
        lines.append(f"  {cat}: {bar} {acc:.0%} ({cnt}문제)")

    weak = [(cat, acc) for cat, acc, _ in sorted_cats if acc < 0.6]
    if weak:
        lines += ["", "취약 카테고리 (정답률 60% 미만):"]
        for cat, acc in weak[:3]:
            lines.append(f"  - {cat} ({acc:.0%}) → 집중 복습 권장")

    lines += [
        "",
        f"현재 연속 정답: {streak}개  |  누적 오답: {mistakes_count}개",
    ]

    return {"messages": [AIMessage(content="\n".join(lines))]}
