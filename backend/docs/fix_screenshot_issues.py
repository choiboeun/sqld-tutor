"""
스크린샷 이슈 수정 (2차)
q290, q449, q511, q110, q312, q364
"""
import json
import shutil
from pathlib import Path

JSONL = Path("app/data/questions/questions_v0.1.jsonl")


PATCHES = {
    # q290: CREATE TABLE 구문이 코드 블록 없이 평문
    "q290": {
        "field": "question",
        "old": (
            "[ERD 및 테이블 정의]\n"
            "-- PROJECT 테이블\n"
            "CREATE TABLE PROJECT (\n"
            "    ProjectID INT PRIMARY KEY,\n"
            "    ProjectName VARCHAR(100)\n"
            ");\n"
            "\n"
            "-- TASK 테이블 (PROJECT 테이블에 대해 식별 관계)\n"
            "CREATE TABLE TASK (\n"
            "    ProjectID INT,\n"
            "    TaskSeqNo INT,\n"
            "    TaskName VARCHAR(100),\n"
            "    PRIMARY KEY (ProjectID, TaskSeqNo),\n"
            "    FOREIGN KEY (ProjectID) REFERENCES PROJECT (ProjectID) ON DELETE CASCADE\n"
            ");"
        ),
        "new": (
            "[ERD 및 테이블 정의]\n"
            "```sql\n"
            "-- PROJECT 테이블\n"
            "CREATE TABLE PROJECT (\n"
            "    ProjectID INT PRIMARY KEY,\n"
            "    ProjectName VARCHAR(100)\n"
            ");\n"
            "\n"
            "-- TASK 테이블 (PROJECT 테이블에 대해 식별 관계)\n"
            "CREATE TABLE TASK (\n"
            "    ProjectID INT,\n"
            "    TaskSeqNo INT,\n"
            "    TaskName VARCHAR(100),\n"
            "    PRIMARY KEY (ProjectID, TaskSeqNo),\n"
            "    FOREIGN KEY (ProjectID) REFERENCES PROJECT (ProjectID) ON DELETE CASCADE\n"
            ");\n"
            "```"
        ),
    },

    # q449: 6개 백틱 코드 블록 + --주석 테이블 → 마크다운 테이블 + 정상 코드 블록
    "q449": {
        "field": "question",
        "old": (
            "제시된 EMPLOYEES_A 테이블과 EMPLOYEES_B 테이블의 데이터를 보고, 다음 두 SQL문의 실행 결과로 출력되는 총 행 수의 합으로 옳은 것은?\n"
            "\n"
            "-- EMPLOYEES_A\n"
            "-- EMP_ID | EMP_NAME\n"
            "-- -------|---------\n"
            "-- 101    | Alice\n"
            "-- 102    | Bob\n"
            "-- 103    | Charlie\n"
            "\n"
            "-- EMPLOYEES_B\n"
            "-- EMP_ID | EMP_NAME\n"
            "-- -------|---------\n"
            "-- 102    | Bob\n"
            "-- 104    | David\n"
            "-- 101    | Alice\n"
            "\n"
            "-- SQL 1\n"
            "```sql\n"
            "SELECT EMP_ID, EMP_NAME FROM EMPLOYEES_A\n"
            "UNION\n"
            "``````sql\n"
            "SELECT EMP_ID, EMP_NAME FROM EMPLOYEES_B;\n"
            "\n"
            "-- SQL 2\n"
            "SELECT EMP_ID, EMP_NAME FROM EMPLOYEES_A\n"
            "UNION ALL\n"
            "``````sql\n"
            "SELECT EMP_ID, EMP_NAME FROM EMPLOYEES_B;\n"
            "```"
        ),
        "new": (
            "제시된 EMPLOYEES_A 테이블과 EMPLOYEES_B 테이블의 데이터를 보고, 다음 두 SQL문의 실행 결과로 출력되는 총 행 수의 합으로 옳은 것은?\n"
            "\n"
            "[EMPLOYEES_A]\n"
            "| EMP_ID | EMP_NAME |\n"
            "|--------|----------|\n"
            "| 101    | Alice    |\n"
            "| 102    | Bob      |\n"
            "| 103    | Charlie  |\n"
            "\n"
            "[EMPLOYEES_B]\n"
            "| EMP_ID | EMP_NAME |\n"
            "|--------|----------|\n"
            "| 102    | Bob      |\n"
            "| 104    | David    |\n"
            "| 101    | Alice    |\n"
            "\n"
            "**[SQL 1]**\n"
            "```sql\n"
            "SELECT EMP_ID, EMP_NAME FROM EMPLOYEES_A\n"
            "UNION\n"
            "SELECT EMP_ID, EMP_NAME FROM EMPLOYEES_B;\n"
            "```\n"
            "\n"
            "**[SQL 2]**\n"
            "```sql\n"
            "SELECT EMP_ID, EMP_NAME FROM EMPLOYEES_A\n"
            "UNION ALL\n"
            "SELECT EMP_ID, EMP_NAME FROM EMPLOYEES_B;\n"
            "```"
        ),
    },

    # q511: COMMIT; 가 INSERT 코드 블록 밖에 평문으로 노출
    "q511": {
        "field": "question",
        "old": (
            "INSERT INTO PRODUCT_SALES VALUES ('P003', 150, 180, 100, NULL);\n"
            "```\n"
            "COMMIT;"
        ),
        "new": (
            "INSERT INTO PRODUCT_SALES VALUES ('P003', 150, 180, 100, NULL);\n"
            "COMMIT;\n"
            "```"
        ),
    },

    # q110: 보기 3·4 plain text → 코드 블록으로 통일
    "q110_opt3": {
        "field": "options",
        "key": "3",
        "old": "CASCADE CONSTRAINTS",
        "new": "```sql\nCASCADE CONSTRAINTS\n```",
    },
    "q110_opt4": {
        "field": "options",
        "key": "4",
        "old": "ALL PRIVILEGES",
        "new": "```sql\nALL PRIVILEGES\n```",
    },

    # q312: -- SQL B 가 코드 블록 밖에 노출 → 두 번째 코드 블록 안으로 이동
    "q312": {
        "field": "question",
        "old": (
            "```sql\n"
            "-- SQL A\n"
            "SELECT WORD FROM WORDS WHERE WORD LIKE 'AP%L';\n"
            "```\n"
            "\n"
            "-- SQL B\n"
            "```sql\n"
            "SELECT WORD FROM WORDS WHERE WORD LIKE 'AP_LE%';\n"
            "```"
        ),
        "new": (
            "```sql\n"
            "-- SQL A\n"
            "SELECT WORD FROM WORDS WHERE WORD LIKE 'AP%L';\n"
            "```\n"
            "\n"
            "```sql\n"
            "-- SQL B\n"
            "SELECT WORD FROM WORDS WHERE WORD LIKE 'AP_LE%';\n"
            "```"
        ),
    },

    # q364: 긴 단일행 SQL → 여러 줄로 분리 (overflow 방지)
    "q364_opt1": {
        "field": "options",
        "key": "1",
        "old": "```sql\nSELECT DEPT_ID, AVG(SALARY) FROM EMPLOYEES WHERE AVG(SALARY) >= 5000000 GROUP BY DEPT_ID;\n```",
        "new": "```sql\nSELECT DEPT_ID, AVG(SALARY)\nFROM EMPLOYEES\nWHERE AVG(SALARY) >= 5000000\nGROUP BY DEPT_ID;\n```",
    },
    "q364_opt2": {
        "field": "options",
        "key": "2",
        "old": "```sql\nSELECT DEPT_ID, AVG(SALARY) FROM EMPLOYEES GROUP BY DEPT_ID HAVING AVG(SALARY) >= 5000000;\n```",
        "new": "```sql\nSELECT DEPT_ID, AVG(SALARY)\nFROM EMPLOYEES\nGROUP BY DEPT_ID\nHAVING AVG(SALARY) >= 5000000;\n```",
    },
    "q364_opt3": {
        "field": "options",
        "key": "3",
        "old": "```sql\nSELECT DEPT_ID, SUM(SALARY) FROM EMPLOYEES GROUP BY DEPT_ID HAVING SUM(SALARY) >= 5000000;\n```",
        "new": "```sql\nSELECT DEPT_ID, SUM(SALARY)\nFROM EMPLOYEES\nGROUP BY DEPT_ID\nHAVING SUM(SALARY) >= 5000000;\n```",
    },
    "q364_opt4": {
        "field": "options",
        "key": "4",
        "old": "```sql\nSELECT DEPT_ID, AVG(SALARY) FROM EMPLOYEES GROUP BY DEPT_ID WHERE AVG(SALARY) >= 5000000;\n```",
        "new": "```sql\nSELECT DEPT_ID, AVG(SALARY)\nFROM EMPLOYEES\nGROUP BY DEPT_ID\nWHERE AVG(SALARY) >= 5000000;\n```",
    },
}


def main():
    shutil.copy(JSONL, JSONL.with_suffix(".jsonl.bak5"))
    print(f"백업: {JSONL.with_suffix('.jsonl.bak5')}")

    rows = []
    changed = 0

    with open(JSONL) as f:
        for line in f:
            q = json.loads(line)
            orig = json.dumps(q, ensure_ascii=False)
            qid = q["id"]

            for patch_key, p in PATCHES.items():
                if not patch_key.startswith(qid):
                    continue

                if p["field"] == "question":
                    if p["old"] in q.get("question", ""):
                        q["question"] = q["question"].replace(p["old"], p["new"])
                        print(f"  수정: {patch_key}")

                elif p["field"] == "options":
                    key = p["key"]
                    if q.get("options", {}).get(key) == p["old"]:
                        q["options"][key] = p["new"]
                        print(f"  수정: {patch_key}")

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
