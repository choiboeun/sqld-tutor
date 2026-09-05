import re
from langchain_core.messages import HumanMessage
from app.agent.state import TutorState
from app.analytics import log_event

_ANY_NUMBER = re.compile(r"^\d")  # 범위 밖 숫자(5, 7 등)도 drill이 처리하도록
_REVIEW = re.compile(r"오답|복습|틀린\s*문제")
_CONCEPT_EXPLAIN = re.compile(r"틀린\s*개념|개념\s*복습")  # "틀린 개념 복습" → explain 우선
_NEGATE_DRILL = re.compile(r"문제.{0,5}(주지마|하지마|싫|안\s*줘|필요\s*없)")
_DRILL = re.compile(r"문제\s*(줘|내줘|풀게|풀어|주세요)?")
_EXPLAIN = re.compile(r"설명|뭐야|뭐예요|무엇|개념|알려|이해[가하]")
_DIAGNOSE = re.compile(r"약점|분석|취약|통계|결과|어디.*약")
_SQL = re.compile(r"실행|(?<!서브)(?<!계층형\s)(?<!계층\s)쿼리(?!\s*[가를는이란])|돌려", re.IGNORECASE)
_DIAGNOSTIC_START = re.compile(r"진단\s*시작|초기\s*진단|다시\s*진단|진단\s*다시|진단\s*해줘|진단\s*받고|진단\s*문제")
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
    # 단, "X 문제 줘" 같은 명시적 새 문제 요청은 pending 해제 후 drill로 전환
    # (홈에서 카테고리 버튼 클릭 시 pending에 막히는 버그 방지)
    if pending:
        if _DRILL_EXPLICIT.search(text) and not _REVIEW.search(text):
            return {"current_mode": "drill", "pending_question": {}}
        prior = state.get("current_mode", "drill")
        mode = prior if prior in ("drill", "review") else "drill"
        return {"current_mode": mode}

    # 초기 진단 시작 — 다른 패턴보다 먼저 체크
    if _DIAGNOSTIC_START.search(text):
        # 이미 진단 완료 → 차단
        if state.get("is_diagnostic_done", False):
            return {"current_mode": "diagnostic_block"}
        # 이미 진단 진행 중 → 카운터 유지하며 이어서
        if state.get("is_diagnostic", False):
            return {"current_mode": "drill"}
        return {"current_mode": "drill", "is_diagnostic": True, "diagnostic_start_count": state.get("total_answered") or 0}

    # 채점 직후 follow_up_mode 활성 → 질문은 chatbot으로 라우팅
    if state.get("follow_up_mode", False):
        # "문제 줘" / "다음 문제" 등 명시적 새 문제 요청만 follow_up 종료
        # bare "문제" ("이 문제에 대해서...")는 종료 조건에서 제외
        if _DRILL_EXPLICIT.search(text):
            return {"current_mode": "drill", "follow_up_mode": False}
        # 오답 복습 / 약점 분석 / 개념 설명 / SQL은 follow_up_mode에서도 즉시 허용
        # "틀린 개념 복습"은 _REVIEW보다 먼저 체크 (복습 키워드 오매칭 방지)
        if _CONCEPT_EXPLAIN.search(text):
            return {"current_mode": "explain", "follow_up_mode": False}
        if _REVIEW.search(text):
            return {"current_mode": "review", "follow_up_mode": False}
        if _DIAGNOSE.search(text):
            return {"current_mode": "diagnose", "follow_up_mode": False}
        if _SQL.search(text):
            return {"current_mode": "sql", "follow_up_mode": False}
        if _EXPLAIN.search(text):
            return {"current_mode": "explain", "follow_up_mode": False}
        return {"current_mode": "chat"}

    # 명시적 drill 요청("문제 줘" 등)을 먼저 체크하고, 이후 설명 의도를 우선 처리.
    # bare "문제" 단독 매칭은 폴백으로 두어 "이 문제 개념이 뭐야?" 같은 입력이 explain으로 가도록 함.
    # "틀린 개념 복습"은 _REVIEW(복습 키워드)보다 먼저 체크
    if _CONCEPT_EXPLAIN.search(text):
        mode = "explain"
    elif _REVIEW.search(text):
        mode = "review"
    elif _NEGATE_DRILL.search(text):
        mode = "chat"
    elif _DRILL_EXPLICIT.search(text):
        mode = "drill"
    elif _SQL.search(text):
        mode = "sql"
    elif _EXPLAIN.search(text):
        mode = "explain"
    elif _DIAGNOSE.search(text):
        mode = "diagnose"
    elif _DRILL.search(text):
        mode = "drill"
    else:
        mode = "chat"

    if mode in ("explain", "diagnose", "sql", "review"):
        user_id = state.get("user_id") or "anonymous"
        log_event(user_id, "feature_used", {"feature": mode, "text": text[:100]})
    return {"current_mode": mode}
