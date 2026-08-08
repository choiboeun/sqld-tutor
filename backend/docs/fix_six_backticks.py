"""
6개 백틱(``````sql) 이슈 수정
q419, q429, q430, q431, q435, q438, q445, q446, q448, q452, q467
"""
import json
import shutil
from pathlib import Path

JSONL = Path("app/data/questions/questions_v0.1.jsonl")

# q448은 구조 자체가 깨져 있어 전체를 교체
Q448_NEW = (
    "다음은 두 개의 SELECT 문을 집합 연산자로 결합하려는 시도이다. 이 중 오류가 발생할 수 있는 SQL 문은?\n"
    "\n"
    "**가.**\n"
    "```sql\n"
    "SELECT EMP_ID, EMP_NAME FROM EMPLOYEES\n"
    "UNION ALL\n"
    "SELECT DEPT_ID, DEPT_NAME FROM DEPARTMENTS;\n"
    "```\n"
    "\n"
    "**나.**\n"
    "```sql\n"
    "SELECT EMP_ID, EMP_NAME FROM EMPLOYEES\n"
    "UNION\n"
    "SELECT ID, NAME FROM TEMP_EMPLOYEES;\n"
    "```\n"
    "\n"
    "**다.**\n"
    "```sql\n"
    "SELECT EMP_ID, EMP_NAME, HIRE_DATE FROM EMPLOYEES\n"
    "MINUS\n"
    "SELECT ID, NAME FROM TEMP_EMPLOYEES;\n"
    "```\n"
    "\n"
    "**라.**\n"
    "```sql\n"
    "SELECT EMP_ID FROM EMPLOYEES\n"
    "INTERSECT\n"
    "SELECT EMP_ID FROM TEMP_EMPLOYEES;\n"
    "```"
)


def fix_six_backticks(text: str) -> str:
    """``````sql\n → 제거 (코드 블록 내 잘못 삽입된 펜스 제거)"""
    return text.replace("``````sql\n", "")


def main():
    shutil.copy(JSONL, JSONL.with_suffix(".jsonl.bak7"))
    print(f"백업: {JSONL.with_suffix('.jsonl.bak7')}")

    rows = []
    changed = 0

    simple_targets = {
        "q419", "q429", "q430", "q431", "q435",
        "q438", "q445", "q446", "q452", "q467",
    }

    with open(JSONL) as f:
        for line in f:
            q = json.loads(line)
            orig = json.dumps(q, ensure_ascii=False)
            qid = q["id"]

            if qid == "q448":
                q["question"] = Q448_NEW
                print(f"  수정: q448 (전체 교체)")

            elif qid in simple_targets:
                for field in ["question", "context"]:
                    text = q.get(field) or ""
                    if "``````sql" in text:
                        q[field] = fix_six_backticks(text)

            new = json.dumps(q, ensure_ascii=False)
            if orig != new:
                changed += 1
                if qid != "q448":
                    print(f"  수정: {qid}")

            rows.append(q)

    with open(JSONL, "w") as f:
        for q in rows:
            f.write(json.dumps(q, ensure_ascii=False) + "\n")

    print(f"\n총 {changed}개 문제 수정 완료")


if __name__ == "__main__":
    main()
