import re
from langchain_core.messages import HumanMessage
from app.agent.state import TutorState
from app.analytics import log_event

_ANSWER = re.compile(r"^[1-4]번?")
_ANY_NUMBER = re.compile(r"^\d")  # 범위 밖 숫자(5, 7 등)도 drill이 처리하도록
_REVIEW = re.compile(r"오답|복습|틀린\s*문제")
_NEGATE_DRILL = re.compile(r"문제.{0,5}(주지마|하지마|싫|안\s*줘|필요\s*없)")
_DRILL = re.compile(r"문제\s*(줘|내줘|풀게|풀어|주세요)?|풀어|시작")
_EXPLAIN = re.compile(r"설명|뭐야|뭐예요|무엇|개념|알려|이해[가하]")
_DIAGNOSE = re.compile(r"약점|분석|취약|통계|결과|어디.*약")
_SQL = re.compile(r"SELECT\b|실행|쿼리|돌려", re.IGNORECASE)
_DIAGNOSTIC_START = re.compile(r"진단\s*시작|초기\s*진단")
# follow_up_mode 종료 조건 — "문제 줘" 등 명시적 새 문제 요청만 (bare "문제" 제외)
_DRILL_EXPLICIT = re.compile(r"문제\s*(줘|내줘|풀게|풀어|주세요)|다음\s*문제|새\s*문제")


def intent_classifier(state: TutorState) -> dict:
    last_human = next(
        (m for m in reversed(state["messages"]) if isinstance(m, HumanMessage)), None
    )
    if not last_human:
        return {"current_mode": "chat"}

    text = last_human.content.strip()
    pending = state.get("pending_question") or {}

    # pending 중에는 숫자/비숫자 모두 drill로 강제
    # 비숫자 입력은 drill_node가 "현재 문제에 먼저 답해주세요" 안내 처리
    if pending:
        prior = state.get("current_mode", "drill")
        mode = prior if prior in ("drill", "review") else "drill"
        print(f"[intent] pending 있음 → mode={mode!r}, text={text!r}")
        return {"current_mode": mode}

    # 초기 진단 시작 — 다른 패턴보다 먼저 체크
    if _DIAGNOSTIC_START.search(text):
        total = state.get("total_answered") or 0
        print(f"[intent] text={text!r} → 진단 시작, total_answered={total}")
        return {"current_mode": "drill", "is_diagnostic": True, "diagnostic_start_count": total}

    # 채점 직후 follow_up_mode 활성 → 질문은 chatbot으로 라우팅
    if state.get("follow_up_mode", False):
        # "문제 줘" / "다음 문제" 등 명시적 새 문제 요청만 follow_up 종료
        # bare "문제" ("이 문제에 대해서...")는 종료 조건에서 제외
        if _DRILL_EXPLICIT.search(text):
            print(f"[intent] follow_up_mode 종료 (drill 요청) → drill")
            return {"current_mode": "drill", "follow_up_mode": False}
        # 오답 복습 / 약점 분석은 follow_up_mode에서도 즉시 허용
        if _REVIEW.search(text):
            print(f"[intent] follow_up_mode 종료 (review 요청) → review")
            return {"current_mode": "review", "follow_up_mode": False}
        if _DIAGNOSE.search(text):
            print(f"[intent] follow_up_mode 종료 (diagnose 요청) → diagnose")
            return {"current_mode": "diagnose", "follow_up_mode": False}
        print(f"[intent] follow_up_mode 활성 → chat, text={text!r}")
        return {"current_mode": "chat"}

    # DRILL을 SQL보다 먼저 체크 — "SQL 활용 문제 줘"처럼 카테고리명에 SQL이 포함된 경우 오분류 방지
    if _REVIEW.search(text):
        mode = "review"
    elif _NEGATE_DRILL.search(text):
        mode = "chat"
    elif _DRILL.search(text):
        mode = "drill"
    elif not pending and _SQL.search(text):
        mode = "sql"
    elif _EXPLAIN.search(text):
        mode = "explain"
    elif _DIAGNOSE.search(text):
        mode = "diagnose"
    else:
        mode = "chat"

    print(f"[intent] text={text!r} → mode={mode!r}")
    if mode in ("explain", "diagnose", "sql", "review"):
        user_id = state.get("user_id") or "anonymous"
        log_event(user_id, "feature_used", {"feature": mode, "text": text[:100]})
    return {"current_mode": mode}
