"""
코드 블록 밖 -- SQL 라벨 수정 + 6개 백틱 이슈 수정
q347, q389, q531, q534, q535
"""
import json
import shutil
from pathlib import Path

JSONL = Path("app/data/questions/questions_v0.1.jsonl")

PATCHES = {
    # q347: -- SQL B 가 코드 블록 밖에 평문
    "q347": {
        "field": "question",
        "old": (
            "```sql\n"
            "-- SQL A\n"
            "SELECT NVL(TO_CHAR(NULL), 123) FROM DUAL;\n"
            "```\n"
            "\n"
            "-- SQL B\n"
            "```sql\n"
            "SELECT COALESCE(TO_CHAR(NULL), 123, 'ABC') FROM DUAL;\n"
            "```"
        ),
        "new": (
            "```sql\n"
            "-- SQL A\n"
            "SELECT NVL(TO_CHAR(NULL), 123) FROM DUAL;\n"
            "```\n"
            "\n"
            "```sql\n"
            "-- SQL B\n"
            "SELECT COALESCE(TO_CHAR(NULL), 123, 'ABC') FROM DUAL;\n"
            "```"
        ),
    },

    # q389: -- SQL 2 (Oracle 구문) 가 코드 블록 밖에 평문
    "q389": {
        "field": "question",
        "old": (
            "```sql\n"
            "-- SQL 1 (ANSI JOIN)\n"
            "SELECT E.EMP_NAME, D.DEPT_NAME\n"
            "FROM EMPLOYEE E JOIN DEPARTMENT D ON E.DEPT_ID = D.DEPT_ID\n"
            "WHERE E.EMP_ID = 101;\n"
            "```\n"
            "\n"
            "-- SQL 2 (Oracle 구문)\n"
            "```sql\n"
            "SELECT E.EMP_NAME, D.DEPT_NAME\n"
            "FROM EMPLOYEE E, DEPARTMENT D\n"
            "WHERE E.DEPT_ID = ( ㄱ )\n"
            "AND E.EMP_ID = 101;\n"
            "```"
        ),
        "new": (
            "```sql\n"
            "-- SQL 1 (ANSI JOIN)\n"
            "SELECT E.EMP_NAME, D.DEPT_NAME\n"
            "FROM EMPLOYEE E JOIN DEPARTMENT D ON E.DEPT_ID = D.DEPT_ID\n"
            "WHERE E.EMP_ID = 101;\n"
            "```\n"
            "\n"
            "```sql\n"
            "-- SQL 2 (Oracle 구문)\n"
            "SELECT E.EMP_NAME, D.DEPT_NAME\n"
            "FROM EMPLOYEE E, DEPARTMENT D\n"
            "WHERE E.DEPT_ID = ( ㄱ )\n"
            "AND E.EMP_ID = 101;\n"
            "```"
        ),
    },

    # q531: -- SQL1/SQL2 라벨 + 6개 백틱 + ```-- SQL2 오류
    "q531": {
        "field": "context",
        "old": (
            "-- SQL1\n"
            "```sql\n"
            "SELECT *\n"
            "FROM (\n"
            "``````sql\n"
            "    SELECT emp_id, emp_name, salary\n"
            "    FROM employees\n"
            "    ORDER BY salary DESC\n"
            ")\n"
            "WHERE ROWNUM <= 3;\n"
            "```-- SQL2\n"
            "```sql\n"
            "SELECT emp_id, emp_name, salary\n"
            "FROM employees\n"
            "ORDER BY salary DESC\n"
            "WHERE ROWNUM <= 3;\n"
            "```"
        ),
        "new": (
            "**[SQL1]**\n"
            "```sql\n"
            "SELECT *\n"
            "FROM (\n"
            "    SELECT emp_id, emp_name, salary\n"
            "    FROM employees\n"
            "    ORDER BY salary DESC\n"
            ")\n"
            "WHERE ROWNUM <= 3;\n"
            "```\n"
            "\n"
            "**[SQL2]**\n"
            "```sql\n"
            "SELECT emp_id, emp_name, salary\n"
            "FROM employees\n"
            "ORDER BY salary DESC\n"
            "WHERE ROWNUM <= 3;\n"
            "```"
        ),
    },

    # q534: -- SQL1/SQL2 라벨 + 6개 백틱 + ```-- SQL2 오류
    "q534": {
        "field": "context",
        "old": (
            "-- SQL1: ROWNUM을 이용한 상위 10개 조회 시도\n"
            "```sql\n"
            "SELECT product_name, sales_amount\n"
            "FROM products\n"
            "WHERE ROWNUM <= 10\n"
            "ORDER BY sales_amount DESC;\n"
            "```-- SQL2: 분석 함수를 이용한 상위 10개 조회\n"
            "```sql\n"
            "SELECT product_name, sales_amount\n"
            "FROM (\n"
            "``````sql\n"
            "    SELECT product_name, sales_amount,\n"
            "           ROW_NUMBER() OVER (ORDER BY sales_amount DESC) AS rn\n"
            "    FROM products\n"
            ")\n"
            "WHERE rn <= 10;\n"
            "```"
        ),
        "new": (
            "**[SQL1]** ROWNUM을 이용한 상위 10개 조회 시도\n"
            "```sql\n"
            "SELECT product_name, sales_amount\n"
            "FROM products\n"
            "WHERE ROWNUM <= 10\n"
            "ORDER BY sales_amount DESC;\n"
            "```\n"
            "\n"
            "**[SQL2]** 분석 함수를 이용한 상위 10개 조회\n"
            "```sql\n"
            "SELECT product_name, sales_amount\n"
            "FROM (\n"
            "    SELECT product_name, sales_amount,\n"
            "           ROW_NUMBER() OVER (ORDER BY sales_amount DESC) AS rn\n"
            "    FROM products\n"
            ")\n"
            "WHERE rn <= 10;\n"
            "```"
        ),
    },

    # q535: -- SQL1/SQL2 라벨 + 6개 백틱 + ```-- SQL2 오류
    "q535": {
        "field": "context",
        "old": (
            "-- SQL1\n"
            "```sql\n"
            "SELECT sales_date, region, amount\n"
            "FROM (\n"
            "``````sql\n"
            "    SELECT sales_date, region, amount,\n"
            "           ROW_NUMBER() OVER (PARTITION BY region ORDER BY amount DESC) AS rn\n"
            "    FROM SALES\n"
            ")\n"
            "WHERE rn <= 3;\n"
            "```-- SQL2\n"
            "```sql\n"
            "SELECT sales_date, region, amount\n"
            "FROM SALES\n"
            "WHERE ROWNUM <= 3\n"
            "ORDER BY region, amount DESC;\n"
            "```"
        ),
        "new": (
            "**[SQL1]**\n"
            "```sql\n"
            "SELECT sales_date, region, amount\n"
            "FROM (\n"
            "    SELECT sales_date, region, amount,\n"
            "           ROW_NUMBER() OVER (PARTITION BY region ORDER BY amount DESC) AS rn\n"
            "    FROM SALES\n"
            ")\n"
            "WHERE rn <= 3;\n"
            "```\n"
            "\n"
            "**[SQL2]**\n"
            "```sql\n"
            "SELECT sales_date, region, amount\n"
            "FROM SALES\n"
            "WHERE ROWNUM <= 3\n"
            "ORDER BY region, amount DESC;\n"
            "```"
        ),
    },
}


def main():
    shutil.copy(JSONL, JSONL.with_suffix(".jsonl.bak6"))
    print(f"백업: {JSONL.with_suffix('.jsonl.bak6')}")

    rows = []
    changed = 0

    with open(JSONL) as f:
        for line in f:
            q = json.loads(line)
            orig = json.dumps(q, ensure_ascii=False)
            qid = q["id"]

            if qid in PATCHES:
                p = PATCHES[qid]
                field = p["field"]
                text = q.get(field) or ""
                if p["old"] in text:
                    q[field] = text.replace(p["old"], p["new"])
                    print(f"  수정: {qid} ({field})")
                else:
                    print(f"  ⚠ 매칭 실패: {qid} ({field})")

            new = json.dumps(q, ensure_ascii=False)
            if orig != new:
                changed += 1

            rows.append(q)

    with open(JSONL, "w") as f:
        for q in rows:
            f.write(json.dumps(q, ensure_ascii=False) + "\n")

    print(f"\n총 {changed}개 문제 수정 완료")


if __name__ == "__main__":
    main()
