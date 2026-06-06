import re
from langchain_core.messages import HumanMessage
from app.agent.state import TutorState

_ANSWER = re.compile(r"^[1-4]번?")
_ANY_NUMBER = re.compile(r"^\d")  # 범위 밖 숫자(5, 7 등)도 drill이 처리하도록
_REVIEW = re.compile(r"오답|복습|틀린\s*문제")
_DRILL = re.compile(r"문제\s*(줘|내줘|풀게|풀어|주세요)?|풀어|시작")
_EXPLAIN = re.compile(r"설명|뭐야|뭐예요|무엇|개념|알려|이해[가하]")
_DIAGNOSE = re.compile(r"약점|분석|취약|통계|결과|어디.*약")
_SQL = re.compile(r"SELECT\b|실행|쿼리|돌려|sql\b", re.IGNORECASE)


def intent_classifier(state: TutorState) -> dict:
    last_human = next(
        (m for m in reversed(state["messages"]) if isinstance(m, HumanMessage)), None
    )
    if not last_human:
        return {"current_mode": "chat"}

    text = last_human.content.strip()
    pending = state.get("pending_question") or {}

    # pending 중 숫자 입력은 항상 drill/review 유지 (7 같은 범위 밖 숫자도 drill이 처리)
    if pending and _ANY_NUMBER.match(text):
        return {"current_mode": state.get("current_mode", "drill")}

    if not pending and _SQL.search(text):
        return {"current_mode": "sql"}
    if _REVIEW.search(text):
        return {"current_mode": "review"}
    if _DRILL.search(text):
        return {"current_mode": "drill"}
    if _EXPLAIN.search(text):
        return {"current_mode": "explain"}
    if _DIAGNOSE.search(text):
        return {"current_mode": "diagnose"}

    return {"current_mode": "chat"}
