import sqlite3
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.auth import get_current_user_id
from app.agent.tools.sql_tools import get_sandbox_conn, is_allowed_query, is_blocked_query

router = APIRouter()


class SqlRequest(BaseModel):
    query: str


@router.post("/sql-execute")
async def sql_execute(req: SqlRequest, _: str = Depends(get_current_user_id)):
    query = req.query.strip().rstrip(";")

    if not query:
        return {"columns": [], "rows": [], "error": "쿼리를 입력해주세요."}
    if not is_allowed_query(query):
        return {"columns": [], "rows": [], "error": "SELECT 문만 실행할 수 있어요."}
    if is_blocked_query(query):
        return {"columns": [], "rows": [], "error": "허용되지 않는 구문이 포함되어 있어요."}

    conn = get_sandbox_conn()
    try:
        cursor = conn.execute(query)
        columns = [desc[0] for desc in cursor.description]
        rows = [[str(v) if v is not None else "NULL" for v in row] for row in cursor.fetchall()]
        return {"columns": columns, "rows": rows, "error": None}
    except sqlite3.Error as e:
        return {"columns": [], "rows": [], "error": f"SQL 오류: {e}"}
    finally:
        conn.close()
