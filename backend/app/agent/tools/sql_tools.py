import sqlite3
import re
from langchain_core.tools import tool

_ALLOWED = re.compile(r"^\s*SELECT\b", re.IGNORECASE)
_BLOCKED = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|ATTACH)\b",
    re.IGNORECASE,
)

_SETUP_SQL = """
-- EMP: 문제 데이터와 호환되는 컬럼명 (EMP_ID/EMP_NAME/SALARY/DEPT_ID)
-- 클래식 Oracle 별칭도 지원 (EMPNO/ENAME/SAL/DEPTNO → 뷰로 제공)
CREATE TABLE EMP (
    EMP_ID   INTEGER PRIMARY KEY,
    EMP_NAME TEXT,
    JOB      TEXT,
    MGR_ID   INTEGER,
    HIREDATE TEXT,
    SALARY   REAL,
    BONUS    REAL,
    DEPT_ID  INTEGER
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

-- 클래식 Oracle 컬럼명 호환 뷰 (EMPNO/ENAME/SAL/COMM/DEPTNO)
CREATE VIEW EMP_CLASSIC AS
SELECT EMP_ID AS EMPNO, EMP_NAME AS ENAME, JOB, MGR_ID AS MGR,
       HIREDATE, SALARY AS SAL, BONUS AS COMM, DEPT_ID AS DEPTNO
FROM EMP;

CREATE TABLE DEPT (
    DEPT_ID   INTEGER PRIMARY KEY,
    DEPT_NAME TEXT,
    LOC       TEXT
);
INSERT INTO DEPT VALUES
(10,'ACCOUNTING','NEW YORK'),
(20,'RESEARCH',  'DALLAS'),
(30,'SALES',     'CHICAGO'),
(40,'OPERATIONS','BOSTON');

-- 클래식 Oracle 컬럼명 호환 뷰 (DEPTNO/DNAME)
CREATE VIEW DEPT_CLASSIC AS
SELECT DEPT_ID AS DEPTNO, DEPT_NAME AS DNAME, LOC FROM DEPT;

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
    header = "| " + " | ".join(columns) + " |"
    separator = "|" + "|".join(["---"] * len(columns)) + "|"
    lines = [header, separator]
    for row in rows:
        vals = [str(v) if v is not None else "NULL" for v in row]
        lines.append("| " + " | ".join(vals) + " |")
    lines.append(f"\n총 {len(rows)}건")
    return "\n".join(lines)


@tool
def execute_sql(query: str) -> str:
    """SQLite 샌드박스에서 SQL을 실행하고 결과를 반환한다.
    SELECT만 허용. 사용 가능한 테이블: EMP, DEPT, SALGRADE.
    EMP 컬럼: EMP_ID, EMP_NAME, JOB, MGR_ID, HIREDATE, SALARY, BONUS, DEPT_ID
    DEPT 컬럼: DEPT_ID, DEPT_NAME, LOC
    클래식 별칭 뷰: EMP_CLASSIC(EMPNO/ENAME/SAL/COMM/DEPTNO), DEPT_CLASSIC(DEPTNO/DNAME/LOC)
    """
    query = query.strip().rstrip(";")

    if not _ALLOWED.match(query):
        return "SELECT 문만 실행할 수 있습니다."
    if _BLOCKED.search(query):
        return "허용되지 않는 구문이 포함되어 있습니다."

    conn = _get_conn()
    try:
        cursor = conn.execute(query)
        if cursor.description is None:
            return "결과가 없습니다."
        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        return _format_table(columns, rows)
    except sqlite3.Error as e:
        return f"SQL 오류: {e}"
    finally:
        conn.close()


# Public API for use by sql_execute.py
def get_sandbox_conn() -> sqlite3.Connection:
    return _get_conn()


def is_allowed_query(query: str) -> bool:
    return bool(_ALLOWED.match(query))


def is_blocked_query(query: str) -> bool:
    return bool(_BLOCKED.search(query))
