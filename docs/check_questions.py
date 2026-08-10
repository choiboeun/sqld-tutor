#!/usr/bin/env python3
"""
SQLD 문제 데이터 포맷 자동 검사 스크립트
사용법: python3 docs/check_questions.py [--fix]

검사 항목:
  C1  코드블록 밖 -- 라벨 (-- TABLE명 테이블 등)
  C2  코드블록 밖 SQL 단독 줄 (SAVEPOINT/ROLLBACK/COMMIT 등)
  C3  코드블록 내 줄 끝 한국어 인라인 주석 (; -- 한국어)
  C4  보기에 파이프 텍스트 테이블 (코드블록 안 ```...```)
  C5  [섹션명] 브라켓 라벨이 코드블록 밖에 단독 줄로 존재
  C6  mermaid graph LR/TD 에 |edge label| 사용
  C7  평문 DDL 노출 (CREATE TABLE 없이 "컬럼명 TYPE," 줄이 코드블록 밖에)
  C8  보기 텍스트에 SQL이 코드블록 없이 포함 (SELECT/INSERT 등으로 시작)
"""

import json
import re
import sys
from pathlib import Path

JSONL_PATH = Path(__file__).parent.parent / "backend/app/data/questions/questions_v0.1.jsonl"

# ── 유틸: 코드블록 제거 ──────────────────────────────────────────────────
def strip_code_blocks(text: str) -> str:
    return re.sub(r"```[\s\S]*?```", "CODEBLOCK", text)

def get_code_block_contents(text: str) -> list[str]:
    return re.findall(r"```(?:\w+)?\n?([\s\S]*?)```", text)

# ── 검사 함수들 ─────────────────────────────────────────────────────────

def check_c1(text: str) -> list[str]:
    """코드블록 밖 -- 라벨 (줄 시작이 -- 인 줄)"""
    cleaned = strip_code_blocks(text)
    return [line.strip() for line in cleaned.splitlines()
            if re.match(r"^-- .+", line.strip())]

def check_c2(text: str) -> list[str]:
    """코드블록 밖 SQL 단독 줄 (세미콜론으로 끝나는 SQL)"""
    cleaned = strip_code_blocks(text)
    hits = []
    for line in cleaned.splitlines():
        s = line.strip()
        if (re.match(r"^(SAVEPOINT|ROLLBACK\s+TO|ROLLBACK|COMMIT|BEGIN|END)\b", s, re.I)
                and s.endswith(";")
                and not re.search(r"[가-힣]", s)):
            hits.append(s)
    return hits

def check_c3(text: str) -> list[str]:
    """코드블록 내 줄 끝 한국어 인라인 주석 (코드; -- 한국어)"""
    hits = []
    for block in get_code_block_contents(text):
        for line in block.splitlines():
            if re.search(r";\s*--\s*[가-힣]", line):
                hits.append(line.strip())
    return hits

def check_c4(options: dict) -> list[tuple[str, str]]:
    """보기에 파이프 텍스트 테이블이 코드블록(```) 안에 있는 경우"""
    hits = []
    for k, v in options.items():
        blocks = re.findall(r"```(?!sql|mermaid|python)([\s\S]*?)```", v)
        for b in blocks:
            if re.search(r"-{3,}\||-\|-", b):  # 구분선 패턴
                hits.append((k, b.strip()[:60]))
    return hits

def check_c5(text: str) -> list[str]:
    """[섹션명] 브라켓 라벨이 코드블록 밖 단독 줄로 존재"""
    cleaned = strip_code_blocks(text)
    return [line.strip() for line in cleaned.splitlines()
            if re.match(r"^\[[^\]]{2,30}\]\s*$", line.strip())]

def check_c6(text: str) -> list[str]:
    """mermaid graph LR/TD 에 |edge label| 사용"""
    hits = []
    blocks = re.findall(r"```mermaid\s*([\s\S]*?)```", text)
    for b in blocks:
        if re.search(r"^graph\s+(LR|TD|RL|BT)", b, re.M):
            if re.search(r"\|[^|]+\|", b):  # edge label 패턴
                hits.append(b[:80].strip())
    return hits

def check_c7(text: str) -> list[str]:
    """평문 DDL 노출: 타입 키워드로 끝나는 컬럼 정의 줄이 코드블록 밖에"""
    cleaned = strip_code_blocks(text)
    hits = []
    for line in cleaned.splitlines():
        s = line.strip()
        # "컬럼명 VARCHAR(50)" 또는 "컬럼명 INT PRIMARY KEY," 같은 패턴
        if (re.match(r"^[A-Z_]+\s+(INT|VARCHAR|NUMBER|DATE|CHAR|DECIMAL|FLOAT|BLOB|TEXT|BOOLEAN|TIMESTAMP)", s, re.I)
                and not s.startswith("CREATE")
                and not s.startswith("ALTER")):
            hits.append(s[:80])
    return hits

def check_c8(options: dict) -> list[tuple[str, str]]:
    """보기 텍스트에 SQL이 코드블록 없이 SELECT/INSERT 등으로 시작"""
    hits = []
    for k, v in options.items():
        cleaned = strip_code_blocks(v)
        for line in cleaned.splitlines():
            s = line.strip()
            if (re.match(r"^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|MERGE|WITH)\s+", s, re.I)
                    and not re.search(r"[가-힣]", s)
                    and len(s) > 10):
                hits.append((k, s[:60]))
                break
    return hits

# ── 메인 ─────────────────────────────────────────────────────────────────

def main():
    fix_mode = "--fix" in sys.argv

    with open(JSONL_PATH, encoding="utf-8") as f:
        questions = [json.loads(l) for l in f if l.strip()]

    results: dict[str, list] = {f"C{i}": [] for i in range(1, 9)}

    for q in questions:
        qid = q["id"]
        qtext = q.get("question") or ""
        ctx   = q.get("context") or ""
        opts  = q.get("options") or {}
        full  = qtext + "\n" + ctx

        for hit in check_c1(full):
            results["C1"].append((qid, hit))
        for hit in check_c2(full):
            results["C2"].append((qid, hit))
        for hit in check_c3(full):
            results["C3"].append((qid, hit))
        for hit in check_c4(opts):
            results["C4"].append((qid, *hit))
        for hit in check_c5(full):
            results["C5"].append((qid, hit))
        for hit in check_c6(full):
            results["C6"].append((qid, hit))
        for hit in check_c7(full):
            results["C7"].append((qid, hit))
        for hit in check_c8(opts):
            results["C8"].append((qid, *hit))

    labels = {
        "C1": "코드블록 밖 -- 라벨",
        "C2": "코드블록 밖 SQL 단독 줄 (SAVEPOINT/ROLLBACK 등)",
        "C3": "코드블록 내 줄 끝 한국어 인라인 주석",
        "C4": "보기: 파이프 텍스트 테이블 (코드블록 안)",
        "C5": "[섹션명] 브라켓 라벨 미변환",
        "C6": "mermaid graph LR/TD edge label",
        "C7": "평문 DDL 컬럼 정의 노출",
        "C8": "보기: SQL 코드블록 없이 노출",
    }

    total = 0
    print(f"\n{'='*60}")
    print(f"SQLD 문제 포맷 검사 결과 ({len(questions)}개 문제)")
    print(f"{'='*60}")

    for code, items in results.items():
        if not items:
            print(f"  ✅ {code} {labels[code]}: 이상 없음")
        else:
            total += len(items)
            print(f"\n  ❌ {code} {labels[code]}: {len(items)}건")
            for item in items[:5]:
                qid = item[0]
                detail = item[1] if len(item) > 1 else ""
                print(f"     {qid}: {detail[:70]}")
            if len(items) > 5:
                print(f"     ... 외 {len(items)-5}건")

    print(f"\n{'='*60}")
    if total == 0:
        print("✅ 모든 검사 통과 — 포맷 이슈 없음")
    else:
        print(f"❌ 총 {total}건 발견")
    print(f"{'='*60}\n")

    return total

if __name__ == "__main__":
    issues = main()
    sys.exit(1 if issues else 0)
