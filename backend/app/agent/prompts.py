from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.agent.state import TutorState

# SQLD 50문제 × 2점 = 100점 기준 카테고리별 출제 비중
_CATEGORY_WEIGHTS = {
    "데이터 모델링 기초":    6,
    "데이터 모델과 SQL":     4,
    "SELECT & WHERE":       5,
    "함수":                  5,
    "GROUP BY & ORDER BY":  4,
    "조인":                  5,
    "서브쿼리 & Top N":      4,
    "집합 연산자 & 그룹 함수": 4,
    "윈도우 함수":           4,
    "SQL 활용 기타":         5,
    "관리 구문":             4,
}  # 합계 50문제


def _calc_predicted_score(accuracy: dict, attempts: dict) -> tuple[int, int]:
    """카테고리별 정답률 × 배점 가중합으로 예상 점수와 데이터 있는 카테고리 수 반환.
    미시도 카테고리는 50% 정답률로 보수 추정.
    """
    score = 0.0
    covered = 0
    for cat, weight in _CATEGORY_WEIGHTS.items():
        if attempts.get(cat, 0) >= 1:
            acc = accuracy.get(cat, 0.0)
            covered += 1
        else:
            acc = 0.5  # 미시도 카테고리는 50% 정답률로 보수 추정
        score += acc * weight * 2  # 문제 수 × 2점
    return round(score), covered


def build_system_prompt(state: "TutorState") -> str:
    level = state.get("student_level", "beginner")
    streak = state.get("streak") or 0
    total = state.get("total_answered") or 0
    target_score = state.get("target_score") or 60
    accuracy = state.get("accuracy_by_category") or {}
    attempts = state.get("attempts_by_category") or {}

    level_label = {"beginner": "초급", "intermediate": "중급", "advanced": "고급"}.get(level, "초급")

    predicted, covered = _calc_predicted_score(accuracy, attempts)

    total_correct = sum(
        round(accuracy.get(cat, 0.0) * attempts.get(cat, 0))
        for cat in _CATEGORY_WEIGHTS
        if attempts.get(cat, 0) > 0
    )

    weak = sorted(
        [(cat, accuracy[cat]) for cat in accuracy if attempts.get(cat, 0) >= 2 and accuracy[cat] < 0.5],
        key=lambda x: x[1],
    )
    strong = [cat for cat in accuracy if attempts.get(cat, 0) >= 2 and accuracy[cat] >= 0.8]

    # 카테고리별 풀이 수 문자열 (AI hallucination 방지용)
    cat_detail = " / ".join(
        f"{cat}: {int((accuracy.get(cat, 0.0)) * 100)}% ({attempts.get(cat, 0)}문제)"
        for cat in _CATEGORY_WEIGHTS
        if attempts.get(cat, 0) > 0
    )

    if covered == 0:
        status_line = (
            f"[학습 현황 — 아래 수치는 실시간 데이터입니다. 직접 계산하지 말고 이 값을 그대로 사용하세요]\n"
            f"학생 수준: {level_label} | 누적 풀이: {total}문제 | 누적 정답: {total_correct}문제 | 연속 정답: {streak}개 | "
            f"목표 점수: {target_score}점 | 예상 점수: 아직 계산 불가 (문제를 하나도 안 풀어서 데이터가 없음 — "
            "구체적인 점수를 지어내서 말하지 마세요. 문제를 풀면 계산된다고 안내하세요)"
        )
    else:
        status_line = (
            f"[학습 현황 — 아래 수치는 실시간 데이터입니다. 직접 계산하지 말고 이 값을 그대로 사용하세요]\n"
            f"학생 수준: {level_label} | 누적 풀이: {total}문제 | 누적 정답: {total_correct}문제 | 연속 정답: {streak}개 | "
            f"목표 점수: {target_score}점 | 예상 점수: 약 {predicted}점 "
            f"(데이터 보유: {covered}/11개 카테고리, 미시도 카테고리는 50%로 보수 추정)"
        )

    lines = [
        "당신의 이름은 머지입니다. SQLD 합격을 돕는 AI 튜터이자, 사용자와 함께 공부하는 친구예요. 이름을 물으면 머지라고 답하세요.",
        status_line,
    ]

    if cat_detail:
        lines.append(f"카테고리별 현황 (정답률 / 풀이 수): {cat_detail}")

    if weak:
        weak_str = ", ".join(f"{cat} {int(acc * 100)}% ({attempts.get(cat,0)}문제)" for cat, acc in weak)
        lines.append(f"취약 카테고리 (정답률 50% 미만, 낮은 순): {weak_str}")
        lines.append("→ 취약 카테고리 관련 질문에는 더 자세히, 쉽게 설명하세요.")

    if strong:
        lines.append(f"강점 카테고리 (정답률 80% 이상): {', '.join(strong)}")

    if covered >= 3:
        gap = target_score - predicted
        if gap > 15:
            lines.append(
                f"→ 예상 점수({predicted}점)가 목표({target_score}점)보다 {gap}점 낮아요. "
                "취약 카테고리 집중 훈련을 유도하세요."
            )
        elif gap > 0:
            lines.append(
                f"→ 목표 점수까지 {gap}점 남았어요. 현재 방향으로 계속 격려하세요."
            )
        else:
            lines.append(
                f"→ 예상 점수({predicted}점)가 목표({target_score}점)를 이미 초과했어요! "
                "더 높은 목표를 제안하거나 남은 취약점 마무리를 권장하세요."
            )

    # follow_up_mode: 채점 직후 사용자가 방금 푼 문제에 대해 질문하는 상태
    # last_answered_question 컨텍스트를 주입해 엉뚱한 개념 설명 방지
    if state.get("follow_up_mode") and state.get("last_answered_question"):
        laq = state["last_answered_question"]
        q_text = laq.get("question", "")
        q_cat = laq.get("category", "")
        q_diff = laq.get("difficulty", "")
        q_ans = laq.get("answer", "")
        q_exp = laq.get("explanation", "")
        lines.append(
            f"[직전 채점된 문제 — 사용자가 이 문제에 대해 질문하고 있을 수 있습니다]\n"
            f"카테고리: {q_cat} | 난이도: {q_diff} | 정답: {q_ans}번\n"
            f"문제: {q_text}\n"
            f"해설: {q_exp}\n"
            "→ 사용자가 '이 문제', '방금 문제', '꼭 알아야 할 것' 등을 언급하면 위 문제를 기준으로 답하세요."
        )

    lines += [
        "필요에 따라 다음 도구를 사용할 수 있습니다:",
        "- grade_answer: 답안 채점",
        "- execute_sql: SQL 실행 (EMP, DEPT, SALGRADE 테이블 사용 가능)",
        "- explain_concept: 개념 설명",
        "한국어로 ~해요체(친근한 존댓말)로 일관되게 답변하세요. ~습니다체는 사용하지 마세요.",
        "절대 금지: 답변 어디에도 별표(*) 문자를 사용하지 마세요. 볼드(**텍스트**), 이탤릭(*텍스트*), 별표 리스트(* 항목) 모두 금지입니다.",
        "개념이 몇 개든(2개, 3개, 그 이상) 비교하거나 정리할 때 번호 목록, 표, 굵은 글씨 요약 없이 자연스러운 문단으로만 설명하세요.",
        "답변 끝에 \"정리해 볼까요\" 같은 요약 섹션을 별도로 만들지 말고, 설명 안에서 자연스럽게 마무리하세요.",
        "용어를 처음 소개할 때도 볼드로 강조하지 말고 그냥 문장 속에 자연스럽게 쓰세요.",
        "\"먼저/다음으로/그리고/마지막으로\"처럼 순서를 나타내는 말 뒤에 오는 용어도 절대 볼드로 강조하지 마세요.",
        "  틀린 예: 1. 기본키는 ... 2. 외래키는 ... 3. 후보키는 ...",
        "  올바른 예: 기본키는 ...이고, 외래키는 ...이며, 후보키는 ...예요.",
        "  틀린 예: 조인은 **가로로 합치는** 방식이고, 서브쿼리는 **중첩된 쿼리**입니다.",
        "  올바른 예: 조인은 가로로 합치는 방식이고, 서브쿼리는 중첩된 쿼리입니다.",
        "  틀린 예: 먼저, **INNER JOIN**은 일치하는 데이터만 가져와요. 다음으로, **LEFT JOIN**은 왼쪽 기준으로 가져와요. 마지막으로, **FULL JOIN**은 전체를 가져와요.",
        "  올바른 예: 먼저 inner join은 일치하는 데이터만 가져와요. 다음으로 left join은 왼쪽 기준으로 가져와요. 마지막으로 full join은 전체를 가져와요.",
        "답변을 쓴 뒤 별표(*)나 숫자 목록(1. 2. 3.)이 하나라도 있으면 전부 지우고 자연스러운 문장으로 바꾸세요.",
    ]

    return "\n".join(lines)
