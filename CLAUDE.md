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
| Phase 1-A | 9~12주 | Gate 3 | 제품화 — UI와 인프라 (CLI → 웹 서비스) |
| Phase 1-B | 13~16주 | Gate 4 | 베타 출시와 진짜 검증 (5명 베타 + 결과 분석) |

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

---

### ✅ 6주차 (완료)
- [x] `generate_sqld_question(category, difficulty)` — 카테고리·난이도 파라미터 추가
- [x] `grade_answer(question_id, student_answer)` — 결정론적 채점 도구 신규
- [x] `execute_sql(query)` — SQLite 샌드박스 SQL 실행 도구 신규 (EMP/DEPT/SALGRADE, SELECT만 허용)
- [x] `explain_concept(concept, level)` — 개념 설명 도구 뼈대 신규 (7주차 RAG 교체 예정)
- [x] `sql_node` — SQL 실행 전용 노드, 한글 후처리 텍스트 자동 제거
- [x] `intent_classifier` — "sql" 모드 추가 (SELECT/실행/쿼리 키워드)
- [x] `chatbot_node` — 4개 도구 bind_tools 연결 + ToolNode 완성
- [x] `graph.py` — sql 노드 라우팅 추가, after_chatbot 조건부 엣지 추가

**버그 수정:**
- drill_node/review_node: options dict 형태 선택지 표시 오류 수정
- drill_node: 카테고리·난이도 키워드 파싱 로직 추가 ("조인 문제 줘" → 카테고리 필터)
- state_updater: 오답 후 pending_question 미초기화 버그 수정
- sql_node: 쿼리 끝 한글 후처리 텍스트 자동 제거

**산출물 위치:** `docs/week6/`
- `tool_design.md` — 4개 도구 설계 결정서 (버그 수정 이력 포함)

**구현 파일:** `backend/app/agent/tools/` (grade_tools.py, sql_tools.py, explain_tools.py), `backend/app/agent/nodes/sql_node.py`

### ✅ 7주차 (완료)
- [x] RAG 학습 데이터 작성 — 11개 카테고리 마크다운 파일 (`docs/week7/cat01~cat11`)
- [x] 내용 오류 7건 수정 (NULL 비교 unknown, SELF JOIN WHERE 조건, 파티션 오타 등)
- [x] 인덱싱 파이프라인 구현 (`ingestion/build_index.py`)
  - `##` → `###` 단위 재분할로 226개 청크 (목표 200~300개 달성)
  - 배치 10개 × 15초 간격, 최대 4회 재시도 (Google API rate limit 대응)
  - Chroma DB 저장 (`backend/app/data/chroma_db/`, collection: `sqld_concepts`)
  - 임베딩 모델: `models/gemini-embedding-001` (3072차원)
- [x] `explain_concept` 도구 RAG로 교체 (`backend/app/agent/tools/explain_tools.py`)
  - k=3 청크 retrieval → 컨텍스트 주입 → LLM 답변
  - `@lru_cache(maxsize=1)` 싱글턴 vectorstore
- [x] `explain_node` 버그 수정 — 기존 llm.invoke() 직접 호출 → explain_concept.invoke() 호출로 교체
- [x] CLI 검증 완료 ("조인이 뭐야?" → RAG 기반 시험 포인트 포함 답변)

**산출물 위치:** `docs/week7/`
- `cat01_데이터모델링기초.md` ~ `cat11_관리구문.md` — RAG 학습 데이터 11개 파일 (226개 청크)

**구현 파일:**
- `ingestion/build_index.py` — 마크다운 → Chroma 인덱싱 파이프라인
- `backend/app/agent/tools/explain_tools.py` — RAG 기반 개념 설명 도구
- `backend/app/agent/nodes/explain_node.py` — explain_concept.invoke() 호출로 수정

---

### ✅ 8주차 (완료, Gate 2 통과)
- [x] `adaptive_difficulty_router` 작성 — streak ≥ 3 카테고리 전환, 정답률 < 20% explain 강제 유도
- [x] 동적 시스템 프롬프트 (`build_system_prompt`) — 학생 약점·수준·streak이 매 턴 LLM에 전달
- [x] `state_updater` 완성 — streak ≥ 3 시 `suggest_category_switch` 신호 + 전환 메시지
- [x] `last_explained_category` 도입 — 같은 카테고리 explain 반복 방지 (정답 시 리셋)
- [x] Intent classifier 버그 3개 수정 (범위 밖 숫자 입력, "다음" 과잉 매칭, pending 중 SQL 오발동)
- [x] CLI 멀티 메시지 출력 — 채점 + 자동 explain 순서대로 모두 표시
- [x] 7턴 시나리오 직접 통과 (진단→약점→훈련→설명→재훈련)

**산출물 위치:** `docs/week8/`
- `adaptive_learning_design.md` — adaptive_difficulty_router 설계 결정서
- `dynamic_prompt_design.md` — 동적 시스템 프롬프트 설계
- `scenario_test_report.md` — 7턴 시나리오 통과 기록 + 버그 수정 이력

**구현 파일:**
- `backend/app/agent/prompts.py` — 신규: 동적 시스템 프롬프트 빌더
- `backend/app/agent/graph.py` — adaptive_difficulty_router + 조건부 엣지 추가
- `backend/app/agent/state.py` — `suggest_category_switch`, `last_explained_category` 필드 추가
- `backend/app/agent/nodes/state_updater.py` — streak 신호, last_explained_category 리셋
- `backend/app/agent/nodes/chatbot.py` — 동적 프롬프트 적용
- `backend/app/agent/nodes/explain_node.py` — 적응형 유도 감지, last_explained_category 설정
- `backend/app/agent/nodes/drill_node.py` — suggest_category_switch 반영
- `backend/app/agent/nodes/intent_classifier.py` — 버그 3개 수정
- `backend/app/agent/tools/question_tools.py` — `avoid_category` 파라미터 추가
- `backend/app/main_cli.py` — 멀티 메시지 출력, 초기 State 업데이트

---

### ✅ 9주차 (완료)
- [x] FastAPI 백엔드 구축 — CORS, `/api/chat` SSE 스트리밍, `/api/progress` 엔드포인트
- [x] Next.js 14 프론트엔드 초기화 — App Router, TypeScript, Tailwind CSS
- [x] 채팅 UI — 대화 영역 + 입력창 + 토큰 단위 스트리밍 (SSE)
- [x] 사이드바 — 풀이 수, 연속 정답, 전체 진행률(X/11), 카테고리별 정답률, 취약 카테고리
- [x] `/api/:path*` → FastAPI 프록시 (`next.config.mjs` rewrite)
- [x] react-markdown + remark-gfm — GFM 테이블, 번호 목록, 코드 블록 렌더링
- [x] UI 버그 5개 수정 (테이블 렌더링, 번호 목록, 버블 분리, 빈 불릿, 줄간격)
- [x] 약점 분석 응답 시각화 — 마크다운 테이블 + 볼드 헤더 + 구분선 포맷
- [x] 문제 헤더 뱃지 렌더링 — `[카테고리 / 난이도: X]` 패턴을 색상 뱃지로 변환 (프론트 파싱)
- [x] 사이드바 개선 — 전체 11개 카테고리 표시, 바 두께 증가, 0% 최소 바, 진행률 바, 0개 색상 수정
- [x] AI 버블 너비 확장 (75% → 90%)
- [x] 전체 디버깅 통과 — 백엔드 17개 모듈 import, 5개 시나리오(출제/정답/오답/약점/SQL) 정상 확인

**구현 파일:**
- `backend/app/main.py` — FastAPI 진입점, CORS 설정
- `backend/app/api/chat.py` — SSE 스트리밍 엔드포인트, on_chain_end / on_chat_model_stream 이벤트 처리
- `backend/app/api/progress.py` — 학습 현황 API (전체 11개 카테고리 반환)
- `backend/app/agent/nodes/diagnose_node.py` — 약점 분석 마크다운 테이블 포맷으로 개선
- `frontend/app/chat/page.tsx` — 채팅 UI, SSE 스트리밍, 뱃지 렌더링
- `frontend/components/Sidebar.tsx` — 학습 현황 사이드바
- `frontend/next.config.mjs` — API 프록시 rewrite

---

### ✅ 10주차 (완료)
- [x] `langgraph-checkpoint-postgres`, `psycopg[binary,pool]` 설치 (백엔드)
- [x] `@supabase/supabase-js`, `@supabase/ssr` 설치 (프론트엔드)
- [x] DB 스키마 설계 및 Supabase SQL Editor 실행 — 6개 테이블 + RLS 정책 + 신규 가입 트리거
- [x] `backend/app/db/checkpointer.py` — PostgresSaver + MemorySaver fallback
- [x] `backend/app/agent/graph.py` — get_checkpointer() 연결
- [x] `frontend/lib/supabase/client.ts` — 브라우저 클라이언트
- [x] `frontend/lib/supabase/server.ts` — 서버 클라이언트
- [x] `frontend/app/(auth)/login/page.tsx` — 이메일 로그인 + 카카오 OAuth 버튼
- [x] `frontend/app/(auth)/signup/page.tsx` — 이메일 회원가입 + 인증 메일 안내
- [x] `frontend/app/(auth)/auth/callback/route.ts` — OAuth code → session 교환
- [x] `frontend/middleware.ts` — `/chat` 보호, 미인증 시 `/login` 리다이렉트
- [x] `frontend/app/chat/page.tsx` — `threadId` → Supabase `user.id` 자동 연결
- [x] 로그인/회원가입 실제 동작 확인

**버그 수정:**
- `.env.local` SUPABASE_URL 오타 수정 (`sbkrtgfensnzlkqxwx` → `sbkrtgfensnzlkqxwxpy`)
- `.env.local` ANON_KEY를 Legacy JWT 형식으로 교체 (기존 publishable 형식 → `eyJ...` 형식)

**구현 파일:**
- `docs/week10/schema.sql` — 6개 테이블 + RLS + 트리거
- `backend/app/db/__init__.py`, `backend/app/db/checkpointer.py`
- `frontend/.env.local` — Supabase URL/Key
- `frontend/lib/supabase/client.ts`, `frontend/lib/supabase/server.ts`
- `frontend/app/(auth)/login/page.tsx`, `frontend/app/(auth)/signup/page.tsx`
- `frontend/app/(auth)/auth/callback/route.ts`
- `frontend/middleware.ts`

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

## Phase 1-A 개선 과제 (9주차~, 기능 고도화)

### RAG 개념 설명 고도화 — 문제별 특정 개념 추출 (전 카테고리 해당)

**현재 문제:**  
오답 발생 시 `last_category`(예: "조인", "윈도우 함수")를 RAG 검색 키로 사용하므로 카테고리 전체 개요가 설명됨.  
예) SELF JOIN 문제를 틀려도 "조인 전체(INNER/OUTER/NATURAL JOIN)" 설명이 나옴.  
예) ROW_NUMBER 문제를 틀려도 "윈도우 함수 전체" 설명이 나옴. 11개 카테고리 모두 동일한 문제.

**개선 방향:**  
`questions_v0.1.jsonl`의 `tags` 필드를 활용해 오답 문제의 핵심 태그(예: `["self_join"]`, `["row_number"]`)를  
RAG 검색 키로 사용 → 해당 개념에 집중된 설명 제공.

**구현 위치:**  
- `drill_node.py` / `review_node.py`: 채점 시 `last_grade_result`에 `tags` 포함
- `state_updater.py` 또는 `explain_node.py`: tags → concept 변환 로직 추가
- `explain_tools.py`: concept을 카테고리명 대신 태그 기반 키워드로 RAG 검색

---

## 주의 사항

- 인터뷰 샘플 5명으로 일반화 금지 — 가설로만 기록, 베타 테스트에서 검증
- 카테고리 분류표는 한국데이터산업진흥원 공식 출제기준 PDF와 대조 필요
- 문제 생성 시 저작권 이슈 → 자체 창작으로 해결 완료 (2주차)
- 카테고리는 2024년 개정 기준 11개로 확정 (교수님 승인 2026-05-13)
- 난이도 기준(상/중/하) 확정 완료 (A유형→하, B·E유형→상, C·D유형→중, 교수님 동의 2026-05-15)
