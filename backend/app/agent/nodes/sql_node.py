import re
from langchain_core.messages import AIMessage, HumanMessage
from app.agent.state import TutorState
from app.agent.tools.sql_tools import _get_conn, _format_table, _ALLOWED, _BLOCKED

_SQL_PATTERN = re.compile(
    r"(SELECT\b[\s\S]+?)(?:;|$)", re.IGNORECASE
)

_TABLES_INFO = """사용 가능한 테이블:
• EMP   (EMPNO, ENAME, JOB, MGR, HIREDATE, SAL, COMM, DEPTNO)
• DEPT  (DEPTNO, DNAME, LOC)
• SALGRADE (GRADE, LOSAL, HISAL)"""


def sql_node(state: TutorState) -> dict:
    last_human = next(
        (m for m in reversed(state["messages"]) if isinstance(m, HumanMessage)), None
    )
    if not last_human:
        return {"messages": [AIMessage(content="실행할 SQL을 입력해주세요.")]}

    text = last_human.content.strip()

    # 메시지에서 SELECT 쿼리 추출
    match = _SQL_PATTERN.search(text)
    if not match:
        return {
            "messages": [AIMessage(content=f"SQL 쿼리를 찾을 수 없습니다. SELECT 문을 입력해주세요.\n\n{_TABLES_INFO}")]
        }

    query = match.group(1).strip()
    # 쿼리 끝에 붙은 한글 후처리 텍스트 제거 ("실행해줘", "돌려줘" 등)
    query = re.sub(r'\s+[가-힣][가-힣\s]*$', '', query).strip()

    if not _ALLOWED.match(query):
        return {"messages": [AIMessage(content="SELECT 문만 실행할 수 있습니다.")]}
    if _BLOCKED.search(query):
        return {"messages": [AIMessage(content="허용되지 않는 구문이 포함되어 있습니다.")]}

    try:
        import sqlite3
        conn = _get_conn()
        cursor = conn.execute(query)
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        conn.close()
        result = _format_table(columns, rows)
        return {"messages": [AIMessage(content=result)]}
    except Exception as e:
        return {"messages": [AIMessage(content=f"SQL 오류: {e}\n\n{_TABLES_INFO}")]}
