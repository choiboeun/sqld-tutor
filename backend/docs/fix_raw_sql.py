"""
수정 대상:
  1. question/context 필드에 코드 펜스 없이 SQL이 들어있는 경우 → ```sql ``` 감싸기
  2. options에 파이프 구분 결과 테이블이 있는 경우 → ``` ``` 감싸기
  3. options에 SQL 쿼리가 plain text로 있는 경우 → ```sql ``` 감싸기
"""

import json
import re
import shutil
from pathlib import Path

JSONL = Path("app/data/questions/questions_v0.1.jsonl")

# SQL 블록 시작 키워드 (줄 첫 글자)
_SQL_START = re.compile(
    r"^\s*(CREATE|INSERT|DELETE|UPDATE|SELECT|ALTER|DROP|WITH|MERGE|TRUNCATE)\b",
    re.IGNORECASE,
)
# SQL 연속 줄: 들여쓰기 있거나 닫는 괄호/세미콜론 단독 줄 또는 -- 주석
_SQL_CONT = re.compile(r"^(\s+\S|[ \t]*[)];?\s*$|[ \t]*--)")

# 파이프 결과 테이블 (보기에서): 같은 줄에 파이프가 2개 이상 → 결과 테이블로 판단
_PIPE_TABLE = re.compile(r"[^\|\n]+\|[^\|\n]+\|")

# 이미 코드 펜스 안에 있는 구간을 분리
def _split_fences(text: str) -> list[str]:
    """[non-fenced, fenced, non-fenced, fenced, ...] 형태로 반환"""
    return re.split(r"(```[\s\S]*?```)", text)


def _wrap_sql_blocks(text: str) -> str:
    """비펜스 텍스트에서 SQL 블록을 찾아 ```sql``` 감싸기."""
    lines = text.split("\n")
    result: list[str] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if _SQL_START.match(line):
            sql: list[str] = [line]
            j = i + 1
            while j < len(lines):
                nxt = lines[j]
                if not nxt.strip():
                    # 빈 줄 — 다음 비-빈 줄이 SQL 연속이면 포함
                    k = j + 1
                    while k < len(lines) and not lines[k].strip():
                        k += 1
                    if k < len(lines) and (
                        _SQL_START.match(lines[k]) or _SQL_CONT.match(lines[k])
                    ):
                        sql.extend(lines[j:k])
                        j = k
                    else:
                        break
                elif _SQL_START.match(nxt) or _SQL_CONT.match(nxt):
                    sql.append(nxt)
                    j += 1
                else:
                    break
            result += ["```sql"] + sql + ["```"]
            i = j
        else:
            result.append(line)
            i += 1
    return "\n".join(result)


def fix_text(text: str) -> str:
    """question/context 필드용: 코드 펜스 밖의 SQL 블록만 감싸기."""
    if not text:
        return text
    parts = _split_fences(text)
    out: list[str] = []
    for idx, part in enumerate(parts):
        if idx % 2 == 1:  # 이미 펜스 안
            out.append(part)
        else:
            out.append(_wrap_sql_blocks(part))
    return "".join(out)


def fix_option(text: str) -> str:
    """보기 필드용: 파이프 결과표 또는 SQL 쿼리를 코드 블록으로."""
    if not text:
        return text
    stripped = text.strip()

    # 이미 펜스 처리됨
    if stripped.startswith("```"):
        return text

    # 파이프 결과 테이블 (A001|NULL|NULL|W001 패턴)
    if _PIPE_TABLE.search(stripped):
        lines = [ln.strip() for ln in stripped.split("\n")]
        return "```\n" + "\n".join(lines) + "\n```"

    # SQL 쿼리 (SELECT / CREATE / INSERT 등으로 시작하는 보기)
    if _SQL_START.match(stripped):
        return "```sql\n" + stripped + "\n```"

    return text


def main():
    shutil.copy(JSONL, JSONL.with_suffix(".jsonl.bak"))
    print(f"백업 생성: {JSONL.with_suffix('.jsonl.bak')}")

    rows: list[dict] = []
    changed = 0
    with open(JSONL) as f:
        for line in f:
            q = json.loads(line)
            orig = json.dumps(q, ensure_ascii=False)

            q["question"] = fix_text(q.get("question") or "")
            if q.get("context"):
                q["context"] = fix_text(q["context"])
            q["options"] = {k: fix_option(v) for k, v in q.get("options", {}).items()}

            new = json.dumps(q, ensure_ascii=False)
            if orig != new:
                changed += 1
                print(f"  수정: {q['id']}")
            rows.append(q)

    with open(JSONL, "w") as f:
        for q in rows:
            f.write(json.dumps(q, ensure_ascii=False) + "\n")

    print(f"\n총 {changed}개 수정 완료")


if __name__ == "__main__":
    main()
