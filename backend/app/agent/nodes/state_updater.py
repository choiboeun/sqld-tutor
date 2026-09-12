from langchain_core.messages import AIMessage
from app.agent.state import TutorState
from app.analytics import log_event

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

    # accuracy_by_category 갱신 (correct_count로 직접 추적 — 부동소수점 역산 오차 방지)
    accuracy = dict(state.get("accuracy_by_category") or {})
    correct_counts = dict(state.get("correct_count_by_category") or {})
    new_correct = correct_counts.get(category, 0) + (1 if correct else 0)
    correct_counts[category] = new_correct
    accuracy[category] = new_correct / new_attempts

    # streak / consecutive_wrong
    if correct:
        streak = (state.get("streak") or 0) + 1
        consecutive_wrong = 0
    else:
        streak = 0
        consecutive_wrong = (state.get("consecutive_wrong") or 0) + 1

    # recent_mistakes — drill_node는 추가만, review_node는 이미 제거 처리
    # 초기 진단 중 오답은 추가하지 않음 — 복습 대상에 진단 문제가 섞이는 것 방지
    mistakes = list(state.get("recent_mistakes") or [])
    if not correct and qid not in mistakes and not state.get("is_diagnostic", False):
        mistakes.append(qid)

    # 적응형 신호: streak >= 3 → 카테고리 전환 권장 (review 모드에선 비활성)
    suggest_switch = streak >= _STREAK_THRESHOLD and state.get("current_mode") != "review"
    extra_messages = []
    if suggest_switch and not state.get("is_diagnostic", False):
        extra_messages.append(
            AIMessage(content=f"연속 {streak}개 정답, 머지도 신나요! 다른 카테고리로 넘어갈게요.")
        )

    user_id = state.get("user_id") or "anonymous"
    log_event(user_id, "question_answered", {
        "question_id": qid,
        "category": category,
        "correct": correct,
        "difficulty": result.get("difficulty"),
        "total_answered": (state.get("total_answered") or 0) + 1,
    })
    # 오답 시 wrong_answer_log에 기록, 정답 시 제거 (오답 회고에서 마스터한 문제는 삭제)
    wrong_log = dict(state.get("wrong_answer_log") or {})
    if not correct:
        wrong_log[qid] = result.get("student_answer")
    elif qid in wrong_log:
        del wrong_log[qid]

    diag_q_count = (state.get("diagnostic_question_count") or 0)
    if state.get("is_diagnostic"):
        diag_q_count += 1

    return {
        "accuracy_by_category": accuracy,
        "attempts_by_category": attempts,
        "correct_count_by_category": correct_counts,
        "streak": streak,
        "consecutive_wrong": consecutive_wrong,
        "recent_mistakes": mistakes,
        "total_answered": (state.get("total_answered") or 0) + 1,
        "session_question_count": (state.get("session_question_count") or 0) + 1,
        "diagnostic_question_count": diag_q_count,
        "last_grade_result": None,
        "pending_question": {},
        "suggest_category_switch": suggest_switch,
        "messages": extra_messages,
        "wrong_answer_log": wrong_log,
        "last_category": category,
        "last_wrong_tags": result.get("tags", []) if not correct else None,
        "last_explained_category": None if correct else state.get("last_explained_category"),
        "last_was_correct": correct,
        # 체크포인트 유실 대비 — pq_payload에 포함해 클라이언트 캐시로 복원
        "is_diagnostic": state.get("is_diagnostic", False),
    }
