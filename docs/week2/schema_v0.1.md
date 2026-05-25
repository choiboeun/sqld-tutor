# 문제 데이터셋 스키마 v0.1

**작성일:** 2026-05-13  
**목적:** GPT-4o 생성 문제를 저장할 JSONL 포맷 정의

---

## 1. 스키마 예시

```json
{
  "id": "q001",
  "subject": "데이터 모델링의 이해",
  "main_category": "데이터 모델링의 이해",
  "sub_category": "엔터티",
  "category": "데이터 모델링 기초",
  "question_type": "A",
  "context": null,
  "question": "문제 텍스트",
  "options": {
    "1": "보기 ①",
    "2": "보기 ②",
    "3": "보기 ③",
    "4": "보기 ④"
  },
  "answer": 2,
  "hint": "힌트 텍스트",
  "explanation": "해설 텍스트",
  "tags": ["태그1", "태그2"],
  "difficulty": null,
  "pass_rate": null,
  "created_at": "2026-05-13",
  "verified": false
}
```

---

## 2. 필드 설명

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | 문제 고유 번호 (q001, q002 ...) |
| `subject` | string | 공식 과목명 — 데이터 모델링의 이해 / SQL 기본 및 활용 |
| `main_category` | string | 공식 주요항목 — 데이터 모델링의 이해 / 데이터 모델과 SQL / SQL 기본 / SQL 활용 / 관리 구문 |
| `sub_category` | string | 공식 세부항목 — 엔터티 / SELECT 문 / 윈도우 함수 등 |
| `category` | string | AI 튜터용 11개 카테고리 (accuracy_by_category 연동) |
| `question_type` | string | 문제 유형 — A(개념형) / B(실행결과 예측형) / C(빈칸완성형) / D(코드선택형) / E(ERD분석형) |
| `context` | string\|null | 문제 풀이에 필요한 사전 자료 (테이블, SQL 코드 등). 없으면 null. 마크다운 형식으로 작성 |
| `question` | string | 문제 본문 텍스트 |
| `options` | object | 보기 4개 (키: "1"~"4", 값: 보기 텍스트) |
| `answer` | integer | 정답 번호 (1~4) |
| `hint` | string | AI 튜터 "힌트 보기" 기능용. 전체 해설 전에 주는 방향 제시 |
| `explanation` | string | 오답자에게 보여줄 상세 해설 |
| `tags` | array | 문제에서 다루는 세부 개념 목록 — RAG 검색 및 유사 문제 추천에 활용 |
| `difficulty` | string\|null | 난이도 (상/중/하) — 기준 교수님과 협의 후 확정 예정, 현재 null |
| `pass_rate` | float\|null | 실제 사용자 정답률 (0.0~1.0) — 서비스 운영 후 자동 집계. 난이도 기준 데이터 기반 검증에 활용 |
| `created_at` | string | 문제 생성 날짜 (YYYY-MM-DD) |
| `verified` | boolean | SQLD 합격자 검수 완료 여부 (true / false) |

---

## 3. context 필드 작성 예시

### 테이블만 있는 경우
```
"context": "| ID | NAME | AGE |\n|-----|------|-----|\n| 1 | 홍길동 | 25 |\n| 2 | 김철수 | 30 |"
```

### SQL 코드만 있는 경우
```
"context": "```sql\nSELECT * FROM employees WHERE dept = 'IT';\n```"
```

### 테이블 + SQL 모두 있는 경우
```
"context": "| ID | NAME |\n|----|------|\n| 1 | 홍길동 |\n\n```sql\nSELECT COUNT(*) FROM tb WHERE id = 1;\n```"
```

---

## 4. question_type 기준

| 유형 | 설명 | context 여부 |
|------|------|-------------|
| A | 개념형 — 텍스트 설명만, SQL/테이블 없음 | 주로 null |
| B | SQL 실행결과 예측형 — 테이블+SQL 주어지고 결과값 고르기 | 필수 |
| C | SQL 빈칸완성형 — SQL 빈칸에 함수명/구문 채우기 | 주로 필수 |
| D | SQL 코드선택형 — 조건에 맞는 올바른 SQL 보기 4개 중 고르기 | 선택 |
| E | ERD분석형 — ERD 또는 도식 주어지고 분석 | 필수 |

---

## 5. JSONL 저장 형식

한 줄에 문제 하나씩 저장.

```
{"id": "q001", "subject": "데이터 모델링의 이해", ...}
{"id": "q002", "subject": "SQL 기본 및 활용", ...}
```

**저장 위치:** `backend/app/data/questions/questions_v0.1.jsonl`
