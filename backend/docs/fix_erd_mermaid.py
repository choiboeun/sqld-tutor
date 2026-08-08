"""
ERD 텍스트 묘사 → mermaid erDiagram 변환
q225, q249
"""
import json
import shutil
from pathlib import Path

JSONL = Path("app/data/questions/questions_v0.1.jsonl")

# mermaid erDiagram 표기법 (Crow's Foot)
#   ||  = exactly one (정확히 하나)
#   o|  = zero or one (0..1)
#   |{  = one or many (1..N)
#   o{  = zero or many (0..N)
#
# q225: 부서(1..N) ↔ 사원(0..1)
#   부서 쪽 끝 1..N → 사원 쪽 마커: |{
#   사원 쪽 끝 0..1 → 부서 쪽 마커: o|
#   → 부서 o|--|{ 사원

Q225_MERMAID = """\
```mermaid
erDiagram
    부서 {
        string 부서ID PK
    }
    사원 {
        string 사원ID PK
    }
    부서 o|--|{ 사원 : " "
```"""

Q225_OLD = """\
[ERD 묘사]
- 부서 엔터티: 기본키(부서ID)
- 사원 엔터티: 기본키(사원ID)
- 부서와 사원 엔터티 사이에 관계선이 존재하며, '부서' 쪽 끝에는 최소 1, 최대 N (1..N)을 나타내는 기호가 있고, '사원' 쪽 끝에는 최소 0, 최대 1 (0..1)을 나타내는 기호가 있다.
- 관계선은 실선으로 표시되어 있다."""

# q249: 고객(1) ↔ 주문(0..N)
#   고객 쪽 끝 1 → 주문 쪽 마커: ||
#   주문 쪽 끝 0..N → 고객 쪽 마커: o{
#   → 고객 ||--o{ 주문

Q249_MERMAID = """\
```mermaid
erDiagram
    고객 {
        string 고객ID PK
    }
    주문 {
        string 주문ID PK
    }
    고객 ||--o{ 주문 : " "
```"""

Q249_OLD = """\
[ERD Fragment]
고객 엔티티 -----< 주문 엔티티
(고객 엔티티 쪽 끝에는 '1', 주문 엔티티 쪽 끝에는 '0..N' 기호가 있다)"""


PATCHES = {
    "q225": (Q225_OLD, Q225_MERMAID),
    "q249": (Q249_OLD, Q249_MERMAID),
}


def main():
    shutil.copy(JSONL, JSONL.with_suffix(".jsonl.bak8"))
    print(f"백업: {JSONL.with_suffix('.jsonl.bak8')}")

    rows = []
    changed = 0

    with open(JSONL) as f:
        for line in f:
            q = json.loads(line)
            orig = json.dumps(q, ensure_ascii=False)
            qid = q["id"]

            if qid in PATCHES:
                old, new = PATCHES[qid]
                if old in (q.get("question") or ""):
                    q["question"] = q["question"].replace(old, new)
                    print(f"  수정: {qid}")
                else:
                    print(f"  ⚠ 매칭 실패: {qid}")

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
