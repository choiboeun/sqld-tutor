"""
신규 문제(q221~q530)의 explanation을 원본 스타일로 재작성.
원본 스타일: 번호/불릿 없이, 1~4문장, 핵심 개념 설명 + 오답 이유 내포.
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
PREVIEW_PATH   = Path(__file__).parent / "rewrite_preview.jsonl"

SYSTEM = """당신은 SQLD 시험 해설을 간결하게 작성하는 전문가입니다.

다음 원칙을 따라 explanation을 재작성하세요:
- 번호목록(1. 2. 3.), 불릿(-, *, •), 볼드(**), 헤더(##) 등 마크다운 기호 일절 사용 금지
- 1~4문장 이내로 압축
- "정답은 X번이다." 같은 접두사 없이 바로 핵심 개념 설명으로 시작
- 정답 개념을 설명하면서 오답 보기가 왜 틀렸는지 자연스럽게 내포
- 한국어, 존댓말 없이 서술형으로 작성

[예시 1]
정답: 2번 (LEFT OUTER JOIN)
재작성: LEFT OUTER JOIN은 왼쪽(A) 테이블의 모든 행을 유지한다. A.id=1은 B에 없으므로 B.id 컬럼이 NULL이 된다. A.id=2,3은 B와 매칭되고, B.id=4는 A에 없지만 LEFT JOIN이므로 포함되지 않는다.

[예시 2]
정답: 1번 (별칭 사용 SQL)
재작성: EMP_NAME에 별칭 사원명을 부여하고 문자열 리터럴 'ACTIVE'에 상태라는 별칭을 부여했으며, HR 부서 조건도 올바르게 작성했다. 2번은 SELECT 절에서 별칭을 대입식처럼 사용해 문법이 틀렸다. 3번은 ACTIVE를 문자열 리터럴로 감싸지 않아 컬럼명처럼 해석될 수 있으므로 틀렸다. 4번은 AS의 위치가 잘못되어 문법 오류다.

[예시 3]
정답: 2번 (논리 데이터 모델)
재작성: 논리 데이터 모델은 개념 모델을 바탕으로 엔터티, 속성, 식별자, 관계 등을 보다 구체화하고 정규화 등을 반영해 논리 구조를 설계한 모델이다. 물리 모델은 실제 DBMS 특성과 저장 구조를 반영하는 단계이다.

[예시 4]
정답: 3번 (VIEW DML 제한)
재작성: GROUP BY, DISTINCT, 집계 함수, UNION, 서브쿼리 등이 포함된 VIEW는 INSERT/UPDATE가 불가능하다. 기본 키가 없거나 여러 테이블 조인 시에도 DML이 제한될 수 있다. 모든 경우에 허용된다는 설명은 틀렸다.

[예시 5]
정답: 1번 (UNION vs UNION ALL)
재작성: UNION은 두 조회 결과를 합친 뒤 중복 행을 제거하고, UNION ALL은 중복을 유지한 채 모두 반환한다. INTERSECT는 교집합을 반환하므로 2번 설명은 MINUS에 대한 설명이다. ROLLUP은 컬럼 순서 기준으로 단계적 소계와 총계를 생성하며, GROUPING 함수는 집계로 생성된 NULL이면 1, 일반 행이면 0을 반환한다."""


def format_options(q: dict) -> str:
    opts = q.get("options", {})
    if isinstance(opts, dict):
        items = [(k, opts[k]) for k in sorted(opts.keys(), key=int)]
    else:
        items = [(str(i+1), v) for i, v in enumerate(opts)]
    return "\n".join(f"{k}. {v}" for k, v in items)


def rewrite_one(q: dict) -> str:
    prompt = f"""{SYSTEM}

---
[재작성 대상]
카테고리: {q.get('category')}
정답: {q.get('answer')}번
문제: {q.get('question', '')[:300]}
보기:
{format_options(q)}

현재 explanation:
{q.get('explanation', '')}

재작성된 explanation (마크다운 기호 없는 순수 텍스트, 1~4문장):"""

    r = model.generate_content(prompt)
    return r.text.strip()


def load_questions():
    questions = []
    with open(QUESTIONS_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                questions.append(json.loads(line))
    return questions


def run(test_mode=True, start_id=221, end_id=530):
    questions = load_questions()
    targets = [q for q in questions if start_id <= int(q['id'][1:]) <= end_id]

    if test_mode:
        targets = targets[:5]
        print(f"[테스트 모드] {len(targets)}개만 실행\n")
    else:
        print(f"[전체 실행] {len(targets)}개\n")

    results = []
    for i, q in enumerate(targets):
        print(f"[{i+1}/{len(targets)}] {q['id']} ({q['category']}) 처리 중...")
        new_exp = rewrite_one(q)
        results.append({
            "id": q["id"],
            "category": q["category"],
            "answer": q["answer"],
            "before": q.get("explanation", ""),
            "after": new_exp,
        })
        print(f"  BEFORE: {q.get('explanation','')[:100]}...")
        print(f"  AFTER:  {new_exp[:150]}")
        print()
        if i < len(targets) - 1:
            time.sleep(0.5)

    with open(PREVIEW_PATH, "w", encoding="utf-8") as f:
        for r in results:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    print(f"\n미리보기 저장: {PREVIEW_PATH}")
    return results


def apply(preview_path=PREVIEW_PATH):
    """미리보기 확인 후 실제 파일에 반영."""
    previews = {}
    with open(preview_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                r = json.loads(line)
                previews[r["id"]] = r["after"]

    questions = load_questions()
    updated = 0
    for q in questions:
        if q["id"] in previews:
            q["explanation"] = previews[q["id"]]
            updated += 1

    with open(QUESTIONS_PATH, "w", encoding="utf-8") as f:
        for q in questions:
            f.write(json.dumps(q, ensure_ascii=False) + "\n")

    print(f"{updated}개 explanation 업데이트 완료 → {QUESTIONS_PATH}")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "apply":
        apply()
    elif len(sys.argv) > 1 and sys.argv[1] == "full":
        run(test_mode=False)
    else:
        run(test_mode=True)
