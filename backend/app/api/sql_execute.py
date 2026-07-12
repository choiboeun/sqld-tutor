from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.auth import get_current_user_id
from app.agent.tools.sql_tools import _get_conn, _ALLOWED, _BLOCKED
import sqlite3

router = APIRouter()


class SqlRequest(BaseModel):
    query: str


@router.post("/sql-execute")
async def sql_execute(req: SqlRequest, _: str = Depends(get_current_user_id)):
    query = req.query.strip().rstrip(";")

    if not query:
        return {"columns": [], "rows": [], "error": "쿼리를 입력해주세요."}
    if not _ALLOWED.match(query):
        return {"columns": [], "rows": [], "error": "SELECT 문만 실행할 수 있어요."}
    if _BLOCKED.search(query):
        return {"columns": [], "rows": [], "error": "허용되지 않는 구문이 포함되어 있어요."}

    try:
        conn = _get_conn()
        cursor = conn.execute(query)
        columns = [desc[0] for desc in cursor.description]
        rows = [[str(v) if v is not None else "NULL" for v in row] for row in cursor.fetchall()]
        conn.close()
        return {"columns": columns, "rows": rows, "error": None}
    except sqlite3.Error as e:
        return {"columns": [], "rows": [], "error": f"SQL 오류: {e}"}
