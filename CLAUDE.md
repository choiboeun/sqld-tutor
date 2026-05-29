# SQLD AI Tutor Project — CLAUDE.md

## 프로젝트 개요

**목표:** SQLD 자격증 합격을 돕는 LangGraph 기반 AI 튜터 웹 서비스  
**기간:** 16주 (2026-05-06 ~)  
**운영자:** 컴퓨터공학과 전공 (데이터베이스 수업 이수, SQL 기초 보유)  
**SQLD 합격:** 2026-03-27 (실제 응시자 경험 보유)

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| AI Agent | LangGraph (Python) |
| Backend | FastAPI |
| Frontend | Next.js 14 |
| DB / Auth | Supabase |
| Memory | MemorySaver → PostgresSaver (checkpointing) |
| RAG | 개념 설명용 Retrieval Augmented Generation |
| Observability | LangSmith |
| LLM | Claude API (claude-sonnet-4-6 기본, 최신 모델 우선) |

---

## 핵심 State 스키마

```python
# accuracy_by_category: 11개 카테고리별 정답률 (0.0 ~ 1.0)
# 2024년 개정 기준 반영 (절차형 SQL 삭제, TOP N/PIVOT/정규표현식 추가)
accuracy_by_category = {
    "데이터 모델링 기초": 0.0,
    "데이터 모델과 SQL": 0.0,
    "SELECT & WHERE": 0.0,
    "함수": 0.0,
    "GROUP BY & ORDER BY": 0.0,
    "조인": 0.0,
    "서브쿼리 & Top N": 0.0,
    "집합 연산자 & 그룹 함수": 0.0,
    "윈도우 함수": 0.0,
    "SQL 활용 기타": 0.0,
    "관리 구문": 0.0,
}
```

---

## 4단계 개발 계획

| 단계 | 주차 | Gate | 목표 |
|------|------|------|------|
| Phase 0-A | 1~4주 | Gate 1 | 문제 은행 + LangGraph Walking Skeleton |
| Phase 0-B | 5~8주 | Gate 2 | 핵심 기능 MVP (문제 출제 + 오답 복습) |
| Phase 1-A | 9~12주 | Gate 3 | 약점 분석 + RAG 개념 설명 |
| Phase 1-B | 13~16주 | Gate 4 | 베타 테스트 5명 + 포트폴리오 완성 |

---

## 주차별 진행 현황

### ✅ 1주차 (완료)
- [x] SQLD 합격 회고 작성
- [x] 사용자 인터뷰 5명 (네이버 폼) → 보고서 작성
- [x] 페인포인트 Top 5 도출
- [x] 카테고리 분류표 11개 작성 (2024년 개정 기준, 교수님 승인 2026-05-13)

**산출물 위치:** `docs/week1/`
- `interview_report.md` — 5인 인터뷰 분석 보고서
- `pain_points_top5.md` — 페인포인트 Top 5 (근거 포함)
- `category_table.md` — SQLD 출제범위 11개 카테고리 (2024년 개정 기준)

### ✅ 2주차 (완료)
- [x] 라이선스 검토 → 자체 생성 방향 확정 (저작권 문제 없음)
- [x] 기출 2회차 교차 분석 → 카테고리별 문제 유형 분포표 작성
- [x] 문제 데이터셋 스키마 설계 (schema_v0.1.md)
- [x] GPT로 SQLD 문제 110개 생성 (11개 카테고리 × 10문제)
- [x] 문제 검수 완료 (오류 수정 3건, 답안 편중 해소)

**산출물 위치:** `docs/week2/`
- `license_review.md` — 라이선스 검토 결과
- `dataset_strategy.md` — 데이터셋 전략 결정서
- `schema_v0.1.md` — 문제 JSONL 스키마 정의
- `question_type_distribution.md` — 카테고리별 문제 유형 분포표
- `format_analysis.md` — 기출 50문항 형식 분석 (유형 분포, 2024 개정 삭제/추가 범위, 60회차 기출 현행 범위 확인)

**데이터 위치:** `backend/app/data/questions/questions_v0.1.jsonl`
- 110문제 (11카테고리 × 10문제), verified: false
- 검수 수정 이력: q032 데이터 오류(KIM→KANG), Cat1·Cat6 답안 편중 해소, q034·q107 문장 품질 개선
- 난이도(difficulty): 확정 완료 (A유형→하, B·E유형→상, C·D유형→중)

### ✅ 3주차 (완료)
- [x] 기술 스택 검토 및 확정 (핸드북 5장 기준, Gemini Flash / Claude API로 변경)
- [x] GitHub 레포지토리 생성 (private), 폴더 구조 셋업
- [x] .env 관리, .gitignore, pyproject.toml 작성 (requirements.txt → pyproject.toml)
- [x] API 키 발급 (Gemini Flash, LangSmith 완료 / ANTHROPIC_API_KEY 교수님 대기 중)
- [x] Supabase 인스턴스 생성, 테이블 스키마 초기 설계 (7개 테이블 생성)
- [x] 아키텍처 다이어그램 작성: State 스키마 / 노드 6개 + 엣지 + 라우팅 / 도구 4개 명세 / 데이터 흐름도
- [x] 난이도 기준 교수님 협의 (문제 유형 기반 방향 동의, 2026-05-15)

**산출물 위치:** `docs/week3/`
- `tech_stack_decision.md` — 기술 스택 결정서 (핸드북 대비 변경 사항 포함)
- `architecture_v0.1.md` — 시스템 아키텍처 다이어그램 v0.1

**Supabase 테이블 (7개):** users, conversations, messages, student_progress, question_attempts, events, questions

### ✅ 4주차 (완료, Gate 1 통과)
- [x] LangGraph Walking Skeleton 구현
- [x] Gate 1 체크리스트 통과

**산출물 위치:** `docs/week4/`
- `gate1_checklist.md` — Gate 1 항목별 근거 및 증거 포함 체크리스트
- `walking_skeleton_report.md` — Walking Skeleton 구현 상세 보고서

### ✅ 5주차 (완료)
- [x] State 스키마 확장: `student_level`, `target_score`, `accuracy_by_category`, `recent_mistakes`, `streak`, `retry_count` 등 17개 필드 (3개 → 17개, `review` 모드 추가, `attempts_by_category`·`last_grade_result` 포함)
- [x] 노드 추가: `intent_classifier`, `drill_node`, `review_node`, `explain_node`, `diagnose_node`, `state_updater` (핸드북 대비 `review_node` 1개 추가)
- [x] 일반 엣지 + 조건부 엣지로 연결 (`after_drill` 조건부 엣지: 채점 시 state_updater → END, 출제 시 바로 END)
- [x] `route_by_intent` 라우팅 함수 작성 (`current_mode` 기반 5방향 분기)

**추가 완료 사항 (핸드북 외):**
- `llm.py` — 공유 LLM 모듈 분리 (Gemini 2.5 Flash)
- `question_tools.py` — `get_random_question(exclude_ids)`, `get_question_by_id`, `explanation` 필드 추가
- `main_cli.py` — 17개 필드 초기 state 반영

**산출물 위치:** `docs/week5/`
- `state_schema_v0.2.md` — State 스키마 v0.1→v0.2 변경 이유 및 17개 필드 상세 설명
- `node_graph_design.md` — 노드/그래프 설계 결정서 (노드별 역할·입출력·설계 이유, 엣지 구조)

**구현 파일:** `backend/app/agent/`
- `llm.py`, `nodes/intent_classifier.py`, `drill_node.py`, `review_node.py`, `explain_node.py`, `diagnose_node.py`, `state_updater.py`

**구현 파일:** `backend/app/agent/` (state, nodes/chatbot, tools/question_tools, graph), `backend/app/main_cli.py`  
**LangSmith:** `sqld-tutor` 프로젝트, thread_id `test-session-1` — 9 turns 정상 기록 확인

---

## 주요 페인포인트 (인터뷰 기반)

1. **취약점 파악 어려움** — 어디가 약한지 모름 (4건)
2. **개념→문제 적용 갭** — 알아도 문제에 적용 못함 (4건)
3. **오답 복습 비효율** — 틀린 문제 재복습 체계 없음 (3건)
4. **해설 불충분** — 왜 틀렸는지 이해 안 됨 (3건)
5. **공부 방향 불확실** — 뭘 먼저 해야 할지 모름 (1건, 추가 검증 필요)

---

## 문제 확장 시 보완 우선순위 (Phase 1-A, 9주차~)

> **배경:** `docs/reference/2024개정판_SQLD_개념정리.pdf` (103p) 전수 분석 결과 도출 (2026-05-25)  
> 현재 110문제는 MVP 기능 개발에 충분. 문제 확장 시 아래 순서로 보완.

### 즉시 추가 필요 (기출 빈출 + 완전 누락)
1. **CASE WHEN / DECODE** — SELECT & WHERE 또는 함수 카테고리, 최소 2문제
2. **반정규화** — 데이터 모델과 SQL, 1~2문제
3. **ROWNUM 상세** (잘못된 사용 패턴 포함) — 서브쿼리 & Top N, 1~2문제
4. **MERGE** — 관리 구문, 1문제 (60회차 기출 출제 확인)
5. **NTILE** — 윈도우 함수, 1문제 (60회차 기출 출제 확인)

### 추가 권고 (PDF 내용 있음)
6. **VIEW** (특징/장단점/생성) — 관리 구문, 1문제
7. **TRUNCATE vs DELETE vs DROP 비교** — 관리 구문, 1문제
8. **계층형 가상컬럼** (CONNECT_BY_ISLEAF / CONNECT_BY_ROOT / SYS_CONNECT_BY_PATH) — SQL 활용 기타, 1문제
9. **FETCH FIRST N ROWS ONLY** (Oracle 12c+) — 서브쿼리 & Top N, 1문제
10. **데이터 독립성** (논리적/물리적) — 데이터 모델링 기초, 1문제

### 낮은 우선순위 (커버리지 보완)
- 비율 윈도우 함수: RATIO_TO_REPORT, PERCENT_RANK, CUME_DIST
- 정규표현식 심화: REGEXP_SUBSTR, REGEXP_INSTR, REGEXP_COUNT
- 분산 데이터베이스 (투명성)
- SEQUENCE, SYNONYM, ROLE, WITH ADMIN OPTION
- ALTER TABLE 상세 (컬럼 추가/수정/삭제, 데이터타입 변경)
- 참조 동작 (ON DELETE CASCADE / ON DELETE SET NULL)

---

## 주의 사항

- 인터뷰 샘플 5명으로 일반화 금지 — 가설로만 기록, 베타 테스트에서 검증
- 카테고리 분류표는 한국데이터산업진흥원 공식 출제기준 PDF와 대조 필요
- 문제 생성 시 저작권 이슈 → 자체 창작으로 해결 완료 (2주차)
- 카테고리는 2024년 개정 기준 11개로 확정 (교수님 승인 2026-05-13)
- 난이도 기준(상/중/하) 확정 완료 (A유형→하, B·E유형→상, C·D유형→중, 교수님 동의 2026-05-15)
