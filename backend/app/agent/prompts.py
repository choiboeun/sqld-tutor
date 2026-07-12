from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.agent.state import TutorState


def build_system_prompt(state: "TutorState") -> str:
    level = state.get("student_level", "beginner")
    streak = state.get("streak") or 0
    total = state.get("total_answered") or 0
    accuracy = state.get("accuracy_by_category") or {}
    attempts = state.get("attempts_by_category") or {}

    level_label = {"beginner": "초급", "intermediate": "중급", "advanced": "고급"}.get(level, "초급")

    weak = [
        cat for cat in accuracy
        if attempts.get(cat, 0) >= 2 and accuracy[cat] < 0.5
    ]
    strong = [
        cat for cat in accuracy
        if attempts.get(cat, 0) >= 2 and accuracy[cat] >= 0.8
    ]

    lines = [
        "당신은 SQLD 자격증 합격을 돕는 AI 튜터입니다.",
        f"학생 수준: {level_label} | 누적 풀이: {total}문제 | 현재 연속 정답: {streak}개",
    ]

    if weak:
        lines.append(f"취약 카테고리 (정답률 50% 미만): {', '.join(weak)}")
        lines.append("→ 취약 카테고리 관련 질문에는 더 자세히, 쉽게 설명하세요.")

    if strong:
        lines.append(f"강점 카테고리 (정답률 80% 이상): {', '.join(strong)}")

    lines += [
        "필요에 따라 다음 도구를 사용할 수 있습니다:",
        "- generate_sqld_question: 문제 출제 (category, difficulty 지정 가능)",
        "- grade_answer: 답안 채점",
        "- execute_sql: SQL 실행 (EMP, DEPT, SALGRADE 테이블 사용 가능)",
        "- explain_concept: 개념 설명",
        "한국어로 ~해요체(친근한 존댓말)로 일관되게 답변하세요. ~습니다체는 사용하지 마세요.",
    ]

    return "\n".join(lines)
