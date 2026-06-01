from app.agent.state import TutorState


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
    streak = (state.get("streak") or 0) + (1 if correct else -(state.get("streak") or 0))
    consecutive_wrong = (state.get("consecutive_wrong") or 0) + (0 if correct else 1)
    if correct:
        consecutive_wrong = 0
    else:
        streak = 0

    # recent_mistakes — drill_node는 추가만, review_node는 이미 제거 처리
    mistakes = list(state.get("recent_mistakes") or [])
    if not correct and qid not in mistakes:
        mistakes.append(qid)

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
    }
