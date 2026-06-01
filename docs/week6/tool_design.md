# 도구 설계 결정서 — 6주차

**작성일:** 2026-06-01  
**주제:** 도구 다양화와 SQL 실행 도구 (차별화 포인트)

---

## 개요

5주차에서 노드 기반 라우팅 구조를 완성했다. 6주차에서는 LangChain `@tool` 형식의 도구 4개를 완성하고, `bind_tools + ToolNode`를 통해 LLM이 자연스럽게 도구를 호출할 수 있는 구조를 완성했다.

---

## 도구 4개 설계

### ① `generate_sqld_question(category, difficulty)`

**변경 전 (5주차):** 파라미터 없이 완전 랜덤 출제  
**변경 후 (6주차):** 카테고리·난이도 파라미터 추가

| 파라미터 | 타입 | 설명 |
|---|---|---|
| `category` | str | 카테고리명 (예: "조인", "윈도우 함수"). 빈 문자열이면 전체 |
| `difficulty` | str | 난이도 ("상"/"중"/"하"). 빈 문자열이면 전체 |

**결정 이유:** "조인 문제 줘", "어려운 문제 줘" 같은 자연어 요청을 처리하려면 필터링이 필수. `drill_node`에서 사용자 메시지를 파싱해 카테고리·난이도를 추출 후 전달.

**drill_node 파싱 로직:**
- 카테고리: 11개 카테고리명 + 별칭(join→조인, rollup→집합 연산자 등) 키워드 매칭
- 난이도: "쉬운/쉽게" → 하, "중간/보통" → 중, "어려운/어렵게" → 상

---

### ② `grade_answer(question_id, student_answer)`

**역할:** 결정론적 채점 — LLM 판단 없이 정답 번호와 직접 비교

**반환값:**
```python
{
    "question_id": "q042",
    "student_answer": 3,
    "correct_answer": 2,
    "correct": False,
    "explanation": "해설 텍스트"
}
```

**결정 이유:** 채점은 LLM이 할 필요가 없다. 정답 번호와 학생 답변을 비교하면 충분. chatbot_node가 이 도구를 바인딩해 필요 시 호출 가능. drill_node/review_node는 직접 비교 로직을 유지(더 빠름).

---

### ③ `execute_sql(query)` — 핵심 차별화 기능

**역할:** SQLite 인메모리 샌드박스에서 학생 SQL 직접 실행

**사용 가능 테이블:** SQLD 시험 빈출 테이블 3개

| 테이블 | 컬럼 | 데이터 |
|---|---|---|
| `EMP` | EMPNO, ENAME, JOB, MGR, HIREDATE, SAL, COMM, DEPTNO | 12행 (Oracle 표준 샘플) |
| `DEPT` | DEPTNO, DNAME, LOC | 4행 |
| `SALGRADE` | GRADE, LOSAL, HISAL | 5행 |

**보안 설계:**
- SELECT 문만 허용 (`^\s*SELECT\b` 패턴 검사)
- INSERT/UPDATE/DELETE/DROP 등 차단 (`_BLOCKED` 패턴)
- 매 실행마다 fresh 인메모리 DB 생성 → 이전 실행 영향 없음

**sql_node 설계:**
- 사용자 메시지에서 SELECT 쿼리 추출 (정규식)
- 쿼리 끝 한글 후처리 텍스트 자동 제거 ("실행해줘", "돌려줘" 등)
- intent_classifier에 "sql" 모드 추가 (SELECT/실행/쿼리/돌려 키워드)

**결정 이유:** 다른 SQLD 앱에는 없는 기능. 학생이 SQL을 직접 작성하고 실행 결과를 즉시 확인할 수 있어 학습 효과가 높음.

---

### ④ `explain_concept(concept, level)`

**역할:** SQLD 개념 설명 (학생 수준 맞춤)

| 파라미터 | 값 | 설명 |
|---|---|---|
| `concept` | "JOIN", "HAVING" 등 | 설명할 개념 |
| `level` | "beginner" / "intermediate" / "advanced" | 학생 수준 |

**현재 구현:** LLM 직접 호출 (Gemini 2.5 Flash)  
**7주차 예정:** RAG 기반으로 교체 — SQLD 학습 자료 벡터 스토어에서 검색 후 답변

**결정 이유:** RAG 인덱스 구축(7주차)보다 도구 인터페이스를 먼저 확정. 인터페이스가 동일하므로 내부 구현만 교체하면 됨.

---

## bind_tools + ToolNode 구조

```
chatbot_node (LLM + 4개 도구 바인딩)
    ↓ tool_calls 있으면
ToolNode (실제 도구 실행)
    ↓
chatbot_node (결과 받아 최종 응답)
    ↓
END
```

`after_chatbot` 조건부 엣지:
- tool_calls 있음 → ToolNode → chatbot_node (루프)
- tool_calls 없음 → END

---

## 버그 수정 이력

| 버그 | 원인 | 수정 |
|---|---|---|
| 선택지 "1. 1, 2. 2, 3. 3, 4. 4" 표시 | JSONL options 필드가 dict 형태인데 enumerate로 키만 추출 | isinstance(options, dict) 분기 추가 |
| 오답 후 새 문제 요청 시 pending 미초기화 | drill_node가 pending = {} 반환해도 state_updater에서 명시 안 함 | state_updater 반환값에 `pending_question: {}` 추가 |
| "조인 문제 줘" → 다른 카테고리 출제 | drill_node가 사용자 메시지에서 카테고리 파싱 안 함 | _parse_category / _parse_difficulty 함수 추가 |
| JOIN 쿼리 뒤 "실행해줘" 포함 SQL 오류 | 한글 후처리 텍스트가 쿼리에 포함됨 | 정규식으로 쿼리 끝 한글 제거 |
