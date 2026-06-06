from langchain_core.messages import AIMessage
from app.agent.state import TutorState

_STREAK_THRESHOLD = 3


def state_updater(state: TutorState) -> dict:
    result = state.get("last_grade_result")
    if not result:
        return {}

    category = result["category"]
    correct = result["correct"]
    qid = result["question_id"]

    # attempts_by_category 갱신
    attempts = dict(state.get("attempts_by_category") or {})
    old_attempts = attempts.get(category, 0)
    new_attempts = old_attempts + 1
    attempts[category] = new_attempts

    # accuracy_by_category 갱신 (이전 정답 수 역산 후 재계산)
    accuracy = dict(state.get("accuracy_by_category") or {})
    old_correct = round(accuracy.get(category, 0.0) * old_attempts)
    new_correct = old_correct + (1 if correct else 0)
    accuracy[category] = new_correct / new_attempts

    # streak / consecutive_wrong
    if correct:
        streak = (state.get("streak") or 0) + 1
        consecutive_wrong = 0
    else:
        streak = 0
        consecutive_wrong = (state.get("consecutive_wrong") or 0) + 1

    # recent_mistakes — drill_node는 추가만, review_node는 이미 제거 처리
    mistakes = list(state.get("recent_mistakes") or [])
    if not correct and qid not in mistakes:
        mistakes.append(qid)

    # 적응형 신호: streak >= 3 → 카테고리 전환 권장
    suggest_switch = streak >= _STREAK_THRESHOLD
    extra_messages = []
    if suggest_switch:
        extra_messages.append(
            AIMessage(content=f"연속 {streak}개 정답! 다른 카테고리로 넘어갈게요.")
        )

    return {
        "accuracy_by_category": accuracy,
        "attempts_by_category": attempts,
        "streak": streak,
        "consecutive_wrong": consecutive_wrong,
        "recent_mistakes": mistakes,
        "total_answered": (state.get("total_answered") or 0) + 1,
        "session_question_count": (state.get("session_question_count") or 0) + 1,
        "last_grade_result": None,
        "pending_question": {},
        "suggest_category_switch": suggest_switch,
        "messages": extra_messages,
        # 정답 시 explain 반복 방지 플래그 리셋
        "last_explained_category": None if correct else state.get("last_explained_category"),
    }
