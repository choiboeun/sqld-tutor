import sqlite3
import re
from langchain_core.tools import tool

_ALLOWED = re.compile(r"^\s*SELECT\b", re.IGNORECASE)
_BLOCKED = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|REPLACE|ATTACH)\b",
    re.IGNORECASE,
)

_SETUP_SQL = """
CREATE TABLE EMP (
    EMPNO   INTEGER PRIMARY KEY,
    ENAME   TEXT,
    JOB     TEXT,
    MGR     INTEGER,
    HIREDATE TEXT,
    SAL     REAL,
    COMM    REAL,
    DEPTNO  INTEGER
);
INSERT INTO EMP VALUES
(7369,'SMITH','CLERK',   7902,'1980-12-17', 800, NULL,20),
(7499,'ALLEN','SALESMAN',7698,'1981-02-20',1600,  300,30),
(7521,'WARD', 'SALESMAN',7698,'1981-02-22',1250,  500,30),
(7566,'JONES','MANAGER', 7839,'1981-04-02',2975, NULL,20),
(7654,'MARTIN','SALESMAN',7698,'1981-09-28',1250,1400,30),
(7698,'BLAKE','MANAGER', 7839,'1981-05-01',2850, NULL,30),
(7782,'CLARK','MANAGER', 7839,'1981-06-09',2450, NULL,10),
(7839,'KING', 'PRESIDENT',NULL,'1981-11-17',5000, NULL,10),
(7844,'TURNER','SALESMAN',7698,'1981-09-08',1500,    0,30),
(7900,'JAMES','CLERK',   7698,'1981-12-03', 950, NULL,30),
(7902,'FORD', 'ANALYST', 7566,'1981-12-03',3000, NULL,20),
(7934,'MILLER','CLERK',  7782,'1982-01-23',1300, NULL,10);

CREATE TABLE DEPT (
    DEPTNO INTEGER PRIMARY KEY,
    DNAME  TEXT,
    LOC    TEXT
);
INSERT INTO DEPT VALUES
(10,'ACCOUNTING','NEW YORK'),
(20,'RESEARCH',  'DALLAS'),
(30,'SALES',     'CHICAGO'),
(40,'OPERATIONS','BOSTON');

CREATE TABLE SALGRADE (
    GRADE  INTEGER PRIMARY KEY,
    LOSAL  REAL,
    HISAL  REAL
);
INSERT INTO SALGRADE VALUES
(1,  700, 1200),
(2, 1201, 1400),
(3, 1401, 2000),
(4, 2001, 3000),
(5, 3001, 9999);
"""


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(":memory:")
    conn.executescript(_SETUP_SQL)
    conn.commit()
    return conn


def _format_table(columns: list[str], rows: list[tuple]) -> str:
    if not rows:
        return "결과 없음 (0건)"
    widths = [max(len(str(c)), max(len(str(r[i])) for r in rows)) for i, c in enumerate(columns)]
    sep = "+-" + "-+-".join("-" * w for w in widths) + "-+"
    header = "| " + " | ".join(str(c).ljust(widths[i]) for i, c in enumerate(columns)) + " |"
    lines = [sep, header, sep]
    for row in rows:
        lines.append("| " + " | ".join(str(v).ljust(widths[i]) if v is not None else "NULL".ljust(widths[i]) for i, v in enumerate(row)) + " |")
    lines.append(sep)
    lines.append(f"총 {len(rows)}건")
    return "\n".join(lines)


@tool
def execute_sql(query: str) -> str:
    """SQLite 샌드박스에서 SQL을 실행하고 결과를 반환한다.
    SELECT만 허용. 사용 가능한 테이블: EMP, DEPT, SALGRADE.
    """
    query = query.strip().rstrip(";")

    if not _ALLOWED.match(query):
        return "SELECT 문만 실행할 수 있습니다."
    if _BLOCKED.search(query):
        return "허용되지 않는 구문이 포함되어 있습니다."

    try:
        conn = _get_conn()
        cursor = conn.execute(query)
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        conn.close()
        return _format_table(columns, rows)
    except sqlite3.Error as e:
        return f"SQL 오류: {e}"
