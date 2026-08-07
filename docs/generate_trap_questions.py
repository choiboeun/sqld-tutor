"""
SQLD 핵심 트랩형 상 난이도 문제 생성.
유형별 5개 × 5유형 = 약 25개 생성 후 questions_v0.1.jsonl에 추가.
"""

import json
import os
import time
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv(Path(__file__).parent.parent / "backend/.env")
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")

QUESTIONS_PATH = Path(__file__).parent.parent / "backend/app/data/questions/questions_v0.1.jsonl"
OUTPUT_PATH = Path(__file__).parent / "trap_questions_preview.jsonl"

SCHEMA_EXAMPLE = """
{
  "subject": "SQL 기본 및 활용",
  "category": "조인",
  "context": "[SQL1] SELECT * FROM A LEFT OUTER JOIN B ON A.id=B.id AND B.type='X';\\n[SQL2] SELECT * FROM A LEFT OUTER JOIN B ON A.id=B.id WHERE B.type='X';",
  "question": "두 SQL의 결과 차이에 대한 설명으로 올바른 것은?",
  "options": {
    "1": "SQL1과 SQL2는 항상 동일한 결과를 반환한다.",
    "2": "SQL1은 A의 모든 행을 유지하며 B.type='X' 조건은 ON에서만 적용되지만, SQL2는 WHERE로 인해 B와 매칭되지 않는 A 행이 제거된다.",
    "3": "SQL2는 A의 모든 행을 유지하고 SQL1이 오히려 행을 더 제거한다.",
    "4": "OUTER JOIN에서 WHERE 절 조건은 ON 절보다 먼저 실행된다."
  },
  "answer": 2,
  "hint": "OUTER JOIN에서 ON 조건은 조인 시 적용, WHERE 조건은 조인 후 전체 결과에 적용",
  "explanation": "LEFT OUTER JOIN에서 ON 절의 추가 조건은 조인 과정에서만 적용되어 A의 모든 행이 유지된다. 반면 WHERE 절 조건은 조인 완료 후 적용되므로 B.type이 NULL인 행이 제거되어 사실상 INNER JOIN처럼 동작한다.",
  "tags": ["조인", "OUTER JOIN", "ON", "WHERE", "트랩"],
  "difficulty": "상",
  "pass_rate": null,
  "created_at": "2026-08-07",
  "verified": true
}
"""

TRAP_SPECS = [
    {
        "type": "ROWNUM + ORDER BY 실행순서",
        "count": 5,
        "category": "서브쿼리 & Top N",
        "subject": "SQL 기본 및 활용",
        "tags": ["서브쿼리", "ROWNUM", "ORDER BY", "실행순서", "트랩"],
        "prompt": """ROWNUM + ORDER BY 실행순서 트랩형 SQLD 문제를 생성하세요.
핵심 개념: ROWNUM은 ORDER BY보다 먼저 적용되므로, ORDER BY 없는 서브쿼리에 ROWNUM을 쓰면 정렬 전 행에 번호가 붙음.
올바른 방법: 서브쿼리에서 ORDER BY 먼저 정렬 후 외부쿼리에서 ROWNUM 사용.
문제 유형: 두 SQL 비교, 또는 실행 결과 예측 (구체적인 데이터 테이블 제공 후 행 수/값 예측).
오답 보기는 '순서가 같다', '동일하다' 등 착각을 유도해야 함."""
    },
    {
        "type": "OUTER JOIN ON vs WHERE 조건 위치",
        "count": 4,
        "category": "조인",
        "subject": "SQL 기본 및 활용",
        "tags": ["조인", "OUTER JOIN", "ON", "WHERE", "트랩"],
        "prompt": """OUTER JOIN에서 ON 절과 WHERE 절의 조건 위치 차이 트랩형 SQLD 문제를 생성하세요.
핵심 개념: ON에 추가 조건 → 조인 시점에 적용, 외부 테이블 행 유지됨. WHERE에 조건 → 조인 후 필터링, 외부 테이블 NULL 행도 제거됨(INNER JOIN처럼 동작).
문제 유형: 두 SQL 결과 비교, 구체적인 테이블 데이터 제공 후 결과 예측.
q167과 다른 상황(다른 테이블/컬럼명/조건)으로 생성할 것."""
    },
    {
        "type": "DECODE vs CASE WHEN NULL 처리",
        "count": 4,
        "category": "함수",
        "subject": "SQL 기본 및 활용",
        "tags": ["함수", "DECODE", "CASE", "NULL비교", "트랩"],
        "prompt": """DECODE와 simple CASE WHEN의 NULL 처리 차이 트랩형 SQLD 문제를 생성하세요.
핵심 개념: DECODE(col, NULL, 'Y', 'N') → NULL=NULL을 동등하게 처리해 'Y' 반환. CASE col WHEN NULL → 내부적으로 col=NULL 비교(항상 UNKNOWN) → ELSE 실행.
문제 유형: 두 SQL 비교, 또는 DECODE/CASE 결과값 예측.
q172와 다른 상황(다른 값/컬럼명)으로 생성할 것."""
    },
    {
        "type": "COUNT(*) vs COUNT(컬럼) vs COUNT(DISTINCT)",
        "count": 4,
        "category": "GROUP BY & ORDER BY",
        "subject": "SQL 기본 및 활용",
        "tags": ["COUNT", "NULL", "집계함수", "DISTINCT", "트랩"],
        "prompt": """COUNT(*), COUNT(컬럼), COUNT(DISTINCT 컬럼)의 NULL/중복 처리 차이 트랩형 SQLD 문제를 생성하세요.
핵심 개념: COUNT(*)는 NULL 포함 전체 행 수. COUNT(컬럼)은 NULL 제외. COUNT(DISTINCT 컬럼)은 NULL 제외 + 중복 제거.
문제 유형: 구체적인 테이블 데이터(NULL 포함, 중복값 포함) 제공 후 각 COUNT 결과 예측.
오답: COUNT(*)와 COUNT(컬럼)이 같다, NULL을 1로 센다 등 착각 유도."""
    },
    {
        "type": "ROLLUP/CUBE 소계·총계 행 수 계산",
        "count": 4,
        "category": "집합 연산자 & 그룹 함수",
        "subject": "SQL 기본 및 활용",
        "tags": ["ROLLUP", "CUBE", "GROUP BY", "소계", "트랩"],
        "prompt": """ROLLUP/CUBE 사용 시 생성되는 소계·총계 행 수 트랩형 SQLD 문제를 생성하세요.
핵심 개념: GROUP BY ROLLUP(A, B) → (A,B), (A), () 소계 생성, n+1 단계 소계. GROUP BY CUBE(A, B) → (A,B), (A), (B), () 2^n 조합.
문제 유형: 구체적인 데이터와 GROUP BY ROLLUP/CUBE 쿼리 후 총 행 수 예측.
오답: 일반 GROUP BY 행 수와 같다, CUBE와 ROLLUP 결과가 같다 등."""
    },
]

SYSTEM = """당신은 SQLD 자격증 시험 문제 출제 전문가입니다.

다음 JSON 스키마로 문제를 생성하세요:
{schema}

규칙:
- difficulty: 반드시 "상"
- verified: true
- created_at: "2026-08-07"
- pass_rate: null
- context: SQL 코드가 있으면 반드시 ```sql 코드 블록 또는 [SQL1]/[SQL2] 형식 사용
- options: 반드시 "1"~"4" 키를 가진 dict, 각 보기는 명확하게 틀린 이유가 있어야 함
- answer: 1~4 정수
- explanation: 번호/불릿 없이 1~4문장 단순 줄글, 정답 이유 + 오답이 왜 틀렸는지 내포
- hint: 핵심 개념 키워드 한 줄
- 이미 존재하는 q167(ON vs WHERE), q172(DECODE vs CASE) 문제와 중복되지 않는 새로운 상황으로 생성

반드시 유효한 JSON 배열만 반환하세요. 설명이나 마크다운 없이 JSON만.""".format(schema=SCHEMA_EXAMPLE)


def generate_trap_batch(spec: dict, next_id: int) -> list[dict]:
    prompt = f"""{SYSTEM}

다음 트랩 유형의 문제를 {spec['count']}개 생성하세요:

유형: {spec['type']}
카테고리: {spec['category']}
subject: {spec['subject']}
태그(tags에 포함): {spec['tags']}

{spec['prompt']}

{spec['count']}개를 JSON 배열로 반환. id는 q{next_id:03d}부터 순서대로 부여."""

    r = model.generate_content(prompt)
    text = r.text.strip()

    # JSON 블록 추출
    import re
    m = re.search(r'\[[\s\S]+\]', text)
    if not m:
        raise ValueError(f"JSON 배열을 찾을 수 없음: {text[:200]}")

    items = json.loads(m.group())

    # id 할당 및 필드 정리
    result = []
    for i, item in enumerate(items):
        item['id'] = f"q{next_id + i:03d}"
        item['subject'] = spec['subject']
        item['difficulty'] = '상'
        item['verified'] = True
        item['created_at'] = '2026-08-07'
        item['pass_rate'] = None
        if 'tags' not in item or not item['tags']:
            item['tags'] = spec['tags']
        result.append(item)

    return result


def load_questions():
    questions = []
    with open(QUESTIONS_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                questions.append(json.loads(line))
    return questions


def run():
    questions = load_questions()
    next_id = max(int(q['id'][1:]) for q in questions) + 1

    all_generated = []
    for spec in TRAP_SPECS:
        print(f"\n[{spec['type']}] {spec['count']}개 생성 중...")
        try:
            items = generate_trap_batch(spec, next_id)
            all_generated.extend(items)
            next_id += len(items)
            for item in items:
                print(f"  ✅ {item['id']}: {item['question'][:60]}")
            time.sleep(2)
        except Exception as e:
            print(f"  ❌ 오류: {e}")

    # 미리보기 저장
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        for q in all_generated:
            f.write(json.dumps(q, ensure_ascii=False) + "\n")

    print(f"\n총 {len(all_generated)}개 생성 완료 → {OUTPUT_PATH}")
    return all_generated


def apply():
    questions = load_questions()
    new_qs = []
    with open(OUTPUT_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                new_qs.append(json.loads(line))

    with open(QUESTIONS_PATH, "a", encoding="utf-8") as f:
        for q in new_qs:
            f.write(json.dumps(q, ensure_ascii=False) + "\n")

    print(f"{len(new_qs)}개 추가 완료. 총 {len(questions) + len(new_qs)}개")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "apply":
        apply()
    else:
        run()
