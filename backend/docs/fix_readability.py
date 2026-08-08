"""
가독성 개선 수정:
1. SQL 절 보기에 코드블록 추가 (q157, q160, q358, q381, q424, q454, q459, q463, q464, q469)
2. 평문 테이블 스키마 → 마크다운 테이블 변환 (q252, q261)
3. ASCII ERD → mermaid erDiagram 변환 (q273)
"""
import json
import shutil
from pathlib import Path

JSONL = Path("app/data/questions/questions_v0.1.jsonl")


def sql_block(text: str) -> str:
    return f"```sql\n{text}\n```"


# ─── 1. SQL 절 보기 코드블록 추가 ────────────────────────────────────
SQL_OPT_FIXES: dict[str, dict[str, str]] = {
    "q157": {
        "1": sql_block("GROUP BY GROUPING SETS((DEPTNO, JOB), (DEPTNO), ())"),
        "2": sql_block("GROUP BY GROUPING SETS((DEPTNO, JOB), (JOB), ())"),
        "3": sql_block("GROUP BY GROUPING SETS((DEPTNO, JOB), (DEPTNO), (JOB), ())"),
        "4": sql_block("GROUP BY GROUPING SETS((DEPTNO), (JOB), ())"),
    },
    "q160": {
        "1": sql_block("GROUP BY ROLLUP(A, B)"),
        "2": sql_block("GROUP BY ROLLUP(B, A)"),
        "3": sql_block("GROUP BY CUBE(A, B)"),
        "4": sql_block("GROUP BY A, B"),
    },
    "q358": {
        "1": sql_block("ASC"),
        "2": sql_block("DESC"),
        "3": sql_block("GROUP BY DEPT_NAME"),
        "4": sql_block("HAVING EMP_COUNT > 0"),
    },
    "q381": {
        "1": sql_block("COUNT(*)"),
        "2": sql_block("AVG(SALARY)"),
        "3": sql_block("DISTINCT"),
        "4": sql_block("GROUP BY DEPT_ID"),
    },
    "q424": {
        "1": sql_block("MAX_SALARIES"),
        "2": sql_block("AS MAX_SALARIES"),
        "3": sql_block("WHERE_MAX_SAL"),
        "4": sql_block("ORDER BY MAX_DEPT_SAL DESC"),
    },
    "q454": {
        "1": sql_block("GROUP BY DEPT_ID, JOB_ID, SALE_YEAR WITH ROLLUP"),
        "2": sql_block("GROUP BY DEPT_ID, JOB_ID, SALE_YEAR WITH CUBE"),
        "3": sql_block("GROUP BY GROUPING SETS((DEPT_ID, JOB_ID), (SALE_YEAR))"),
        "4": sql_block(
            "GROUP BY DEPT_ID, JOB_ID UNION ALL SELECT SALE_YEAR, NULL FROM ... GROUP BY SALE_YEAR"
        ),
    },
    "q459": {
        "1": sql_block("GROUP BY REGION, PRODUCT WITH CUBE"),
        "2": sql_block("GROUP BY ROLLUP(REGION, PRODUCT)"),
        "3": sql_block("GROUP BY GROUPING SETS((REGION), (PRODUCT), (REGION, PRODUCT))"),
        "4": sql_block(
            "GROUP BY REGION UNION ALL SELECT ... GROUP BY PRODUCT UNION ALL SELECT ... GROUP BY REGION, PRODUCT"
        ),
    },
    "q463": {
        "1": sql_block("GROUP BY PRODUCT, REGION"),
        "2": sql_block("GROUP BY ROLLUP(REGION, PRODUCT)"),
        "3": sql_block("GROUP BY CUBE(REGION, PRODUCT)"),
        "4": sql_block("GROUP BY GROUPING SETS((PRODUCT), (REGION), (PRODUCT, REGION), ())"),
    },
    "q464": {
        "1": sql_block("DEPT_ID, JOB_ID"),
        "2": sql_block("ROLLUP(DEPT_ID, JOB_ID)"),
        "3": sql_block("CUBE(DEPT_ID, JOB_ID)"),
        "4": sql_block("GROUPING SETS((DEPT_ID), (JOB_ID), ())"),
    },
    "q469": {
        "1": sql_block("ORDER BY EMP_ID"),
        "2": sql_block("ORDER BY CUST_NAME"),
        "3": sql_block("ORDER BY NAME DESC"),
        "4": sql_block("ORDER BY 1, CUST_ID"),
    },
}

# ─── 2. q252: 평문 테이블 정의 → 마크다운 테이블 ──────────────────────

Q252_OLD = (
    "테이블: 수강 (수강번호 PK, 학생ID FK, 학생명, 강의코드 FK, 강의명, "
    "교수ID FK, 교수명, 학점, 수강료, 수강신청일)\n"
    "기본 키(PK): 수강번호 (단일 PK)\n"
    "외래 키(FK): 학생ID (학생테이블 참조), 강의코드 (강의테이블 참조), 교수ID (교수테이블 참조)"
)

Q252_NEW = """\
**[수강 테이블]**

| 컬럼명 | 키 | 비고 |
|--------|-----|------|
| 수강번호 | PK | |
| 학생ID | FK | 학생테이블 참조 |
| 학생명 | | |
| 강의코드 | FK | 강의테이블 참조 |
| 강의명 | | |
| 교수ID | FK | 교수테이블 참조 |
| 교수명 | | |
| 학점 | | |
| 수강료 | | |
| 수강신청일 | | |\
"""

# ─── 3. q261: 인라인 테이블 정의 → 마크다운 테이블 ────────────────────

Q261_OLD = (
    "현재 `상품` 테이블 (상품ID PK, 상품명, 가격)과 "
    "`주문상세` 테이블 (주문상세ID PK, 주문ID FK, 상품ID FK, 수량, 판매일자)이 존재하며, "
    "보고서는 매번 `주문상세` 테이블을 GROUP BY하여 집계한다. "
    "이 문제를 해결하기 위한 방안으로 가장 적절한 것은?"
)

Q261_NEW = """\
현재 다음과 같은 테이블 구조가 있으며, 보고서는 매번 `주문상세` 테이블을 GROUP BY하여 집계한다. 이 문제를 해결하기 위한 방안으로 가장 적절한 것은?

**[상품]**

| 컬럼명 | 키 |
|--------|-----|
| 상품ID | PK |
| 상품명 | |
| 가격 | |

**[주문상세]**

| 컬럼명 | 키 |
|--------|-----|
| 주문상세ID | PK |
| 주문ID | FK |
| 상품ID | FK |
| 수량 | |
| 판매일자 | |\
"""

# ─── 4. q273: ASCII ERD → mermaid erDiagram ────────────────────────────

Q273_OLD = """\
[ERD]
PROJECT (1) ---< (N) PROJECT_PARTICIPANT
(식별 관계: PROJECT_PARTICIPANT의 PK는 PROJECT_ID + PARTICIPANT_ID)\
"""

Q273_NEW = """\
[ERD]
```mermaid
erDiagram
    PROJECT {
        string PROJECT_ID PK
        string PROJECT_NAME
    }
    PROJECT_PARTICIPANT {
        string PROJECT_ID PK
        int PARTICIPANT_ID PK
        string PARTICIPANT_NAME
    }
    PROJECT ||--o{ PROJECT_PARTICIPANT : "식별 관계"
```\
"""

# ───────────────────────────────────────────────────────────────────────

QUESTION_TEXT_PATCHES = {
    "q252": (Q252_OLD, Q252_NEW),
    "q261": (Q261_OLD, Q261_NEW),
    "q273": (Q273_OLD, Q273_NEW),
}


def main() -> None:
    shutil.copy(JSONL, JSONL.with_suffix(".jsonl.bak9"))
    print(f"백업: {JSONL.with_suffix('.jsonl.bak9')}")

    rows = []
    changed = 0

    with open(JSONL) as f:
        for line in f:
            q = json.loads(line)
            orig = json.dumps(q, ensure_ascii=False)
            qid = q["id"]

            # 1. SQL 보기 코드블록
            if qid in SQL_OPT_FIXES:
                for k, new_val in SQL_OPT_FIXES[qid].items():
                    if q["options"].get(k) == new_val.replace("```sql\n", "").replace("\n```", ""):
                        q["options"][k] = new_val
                    elif k in q["options"]:
                        old_val = q["options"][k]
                        if not old_val.startswith("```"):
                            q["options"][k] = new_val
                            print(f"  수정 (option {k}): {qid} — {old_val[:50]}")
                        else:
                            print(f"  이미 코드블록: {qid} opt{k}")

            # 2-4. 문제 본문 패치
            if qid in QUESTION_TEXT_PATCHES:
                old, new = QUESTION_TEXT_PATCHES[qid]
                if old in (q.get("question") or ""):
                    q["question"] = q["question"].replace(old, new)
                    print(f"  수정 (question): {qid}")
                else:
                    print(f"  ⚠ 매칭 실패 (question): {qid}")

            new_json = json.dumps(q, ensure_ascii=False)
            if orig != new_json:
                changed += 1

            rows.append(q)

    with open(JSONL, "w") as f:
        for q in rows:
            f.write(json.dumps(q, ensure_ascii=False) + "\n")

    print(f"\n총 {changed}개 문제 수정 완료")


if __name__ == "__main__":
    main()
