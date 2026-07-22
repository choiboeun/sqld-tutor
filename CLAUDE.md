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
- `backend/app/api/chat.py` — SSE 스트리밍 엔드포인트, drill/review/diagnose/sql/state_updater/explain은 on_chain_end, chatbot만 on_chat_model_stream 토큰 스트리밍
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

### ✅ 10주차 → 11주차 전환 전 전체 디버깅 (완료)

10주차 완료 후 11주차 진행 전 프로젝트 전체 범위 디버깅 실시 (2026-06-08).

**디버깅 범위 및 결과:**

| 항목 | 결과 |
|------|------|
| drill_node (문제 출제/채점/오류입력) | ✅ |
| review_node (오답 복습 → 정답 시 목록 제거) | ✅ |
| explain_node (RAG 개념 설명) | ✅ |
| diagnose_node (약점 분석 마크다운 테이블) | ✅ |
| state_updater (streak/total/accuracy) | ✅ |
| intent_classifier (10가지 패턴 분류) | ✅ |
| streak 3 연속 정답 → 카테고리 전환 메시지 | ✅ |
| progress API (11개 카테고리 정답률) | ✅ |
| 사이드바 실시간 업데이트 | ✅ |
| 로그인/로그아웃/미들웨어 | ✅ |
| 브라우저 UI 6단계 직접 테스트 | ✅ |

**버그 수정 4건:**

1. **보기 불릿 포인트 인라인 표시 문제** (근본 원인 수정)
   - 원인: `explain_concept` 내 post-processing은 `llm.invoke()` 이후에 적용되지만, SSE는 raw 토큰을 스트리밍하여 post-processing이 무시됨
   - 수정: `explain` 노드를 `NON_LLM_NODES`에 추가 → `on_chain_end`에서 post-processed 텍스트 전송
   - 추가: `on_chat_model_stream` 이벤트에서 `explain` 노드 필터링 (중복 전송 방지)
   - 불릿 regex 강화: `\n[ \t]*•` + `([^\n])\s*•\s*` 패턴으로 들여쓰기 서브불릿 및 인라인 불릿 모두 처리

2. **SQL 샌드박스 컬럼명 불일치**
   - 원인: 샌드박스 EMP 테이블이 `EMPNO/ENAME/SAL/DEPTNO` 사용, 문제 데이터 34개는 `EMP_ID/EMP_NAME/SALARY/DEPT_ID` 사용
   - 수정: EMP/DEPT 테이블 컬럼명을 문제 데이터 기준으로 교체
   - 추가: 클래식 Oracle 호환 뷰 `EMP_CLASSIC`, `DEPT_CLASSIC` 생성 (하위 호환)

3. **자동 개념 설명 미트리거 원인 파악**
   - `adaptive_difficulty_router`에 로깅 추가하여 라우팅 값 확인 가능

4. **`** text **` 볼드 공백 처리 + 들여쓰기 서브불릿 regex 누락** (explain_tools.py)

**수정 파일:**
- `backend/app/api/chat.py` — explain을 NON_LLM_NODES에 추가, on_chat_model_stream 노드 필터링
- `backend/app/agent/tools/explain_tools.py` — 불릿 regex 강화 (들여쓰기/인라인 모두 처리)
- `backend/app/agent/tools/sql_tools.py` — EMP/DEPT 컬럼명 교체, 클래식 호환 뷰 추가
- `backend/app/agent/graph.py` — adaptive_difficulty_router 로깅 추가
- `backend/app/agent/nodes/drill_node.py` — `_try_result_table` (result_table 포맷, suffix 튜플 반환), `has_block` 플래그, 한국어 단일 쌍 패턴(1b) 추가
- `frontend/app/chat/page.tsx` — h2/h3 마크다운 컴포넌트 추가

---

### ✅ 11주차 (완료)
- [x] 백엔드 Render 배포 (FastAPI + chroma_db, requirements.txt 추가)
- [x] 프론트엔드 Vercel 배포 (Next.js, 환경변수 설정)
- [x] Supabase Auth 운영 URL 설정 (Site URL + Redirect URL)
- [x] LangSmith 트레이스 운영 환경 동작 확인
- [x] 분석 이벤트 로깅 구축 — `user_events` 테이블 + `analytics.py` 헬퍼
  - `session_start`: 새 세션 시작 시
  - `question_answered`: 문제 채점 완료 시 (정답 여부, 카테고리, 난이도)
  - `feature_used`: explain/diagnose/sql/review 모드 진입 시
- [x] 개인정보처리방침 페이지 (`/privacy`) 신규 생성
- [x] 회원가입 동의 체크박스 추가 (미동의 시 버튼 비활성화)
- [ ] 도메인 연결 (sqld-tutor.com, ~2만원/년) — 교수님 확인 후 진행 예정

**구현 파일:**
- `backend/app/analytics.py` — log_event() 헬퍼
- `backend/app/agent/state.py` — user_id 필드 추가
- `backend/app/agent/nodes/state_updater.py` — question_answered 로깅
- `backend/app/agent/nodes/intent_classifier.py` — feature_used 로깅
- `backend/app/api/chat.py` — session_start 로깅, user_id 주입
- `frontend/app/chat/page.tsx` — user_id 전송
- `frontend/app/privacy/page.tsx` — 개인정보처리방침 페이지
- `frontend/app/(auth)/signup/page.tsx` — 동의 체크박스 추가

---

### ✅ 12주차 (완료)
- [x] 배포 검증 (Render + Vercel 정상 확인)
- [x] 온보딩 페이지 `/onboarding` — 목표 점수 선택 (60/70/80/90점)
- [x] 미들웨어 — 미인증→로그인, 온보딩 미완→온보딩, 완료→채팅 리다이렉트
- [x] 진단 자동 시작 — `/chat?new=true` 진입 시 "진단 시작해줘" 자동 전송
- [x] 진단 뱃지 — `N/8 진단 중` 표시 + 카테고리/난이도 배지 (1~8번 전체)
- [x] 진단 재시작 버그 수정 — `diagnostic_start_count` 스냅샷 방식으로 교체 (session_question_count 리셋 LangGraph 이슈 우회)
- [x] 개념 설명 `**` 렌더링 버그 수정 — 조사를 볼드 안에 포함 지시, 후처리 강화
- [x] 개념 설명 불릿 가독성 개선 — 계층 구조 들여쓰기, `•` → `-` 마크다운 변환
- [x] 초기 진단 리포트 "5문제 미만 신뢰도 낮음" 경고 제거
- [x] 사용성 테스트 1차 (친구 1명) — 모바일 레이아웃 잘림, 4번 보기 회색 박스 오감지 버그 2건 발견
- [x] SQL 보기 오감지 버그 수정 — `_SQL_IN_OPTION` 정규식을 `^` 앵커 기반으로 교체 (한국어 보기 중 SELECT 언급 시 코드 블록 오분류 수정, commit `cec5613`)
- [x] 사용성 테스트 2차 (친구 2명째) — 완료, 전체 흐름 막힘 없이 완주, 태블릿 정상 동작 확인
- [x] pending 문제 UX 개선 — 문제 출제 중 카테고리 변경 요청 시 "현재 문제에 먼저 답해주세요 (1~4번)" 안내 추가 (commit `cbc6d20`)
- [ ] 모바일 레이아웃 수정 — 13주차 처리 예정
- [x] HTTPS 도메인 외부 접속 — `sqld-tutor.vercel.app` (HTTPS)으로 조건 충족 확정, 커스텀 도메인은 브랜딩 목적으로 별도 진행

**산출물 위치:** `docs/week12/`
- `gate3_checklist.md` — Gate 3 기준 4개 항목별 달성 근거 및 현재 상태
- `usability_test_report.md` — 사용성 테스트 결과 (2차 완료, 작성 완료)

**버그 수정 이력:**
- `diagnostic_start_count`: LangGraph PostgresSaver가 정수 `0` 업데이트를 무시하는 이슈 → `total_answered` 스냅샷 방식으로 교체
- 진단 1번 문제 뱃지 미표시: 도입 텍스트가 `**1/8**` 앞에 위치 → 백엔드 포맷 통일 + 프론트 파서 강화
- `**ERD(Entity)**는` bold 미렌더링: `)` 뒤 `**` + 한국어 조사 → CommonMark 파서 인식 실패 → 프롬프트에 조사 포함 지시로 해결
- `_SQL_IN_OPTION`: `\bSELECT\b` → `^\s*(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH|MERGE)\b` — 줄 시작 기준으로 변경해 한국어 보기 오분류 해결
- pending 문제 UX: 비숫자 입력 시 prefix 빈 문자열 → "현재 문제에 먼저 답해주세요 (1~4번)" 안내로 교체

**구현 파일:**
- `frontend/app/onboarding/page.tsx` — 온보딩 목표점수 선택 페이지
- `frontend/middleware.ts` — 인증/온보딩 리다이렉트 미들웨어
- `frontend/app/chat/page.tsx` — 진단 자동 시작, 뱃지 파싱, Suspense 래퍼
- `backend/app/agent/state.py` — `is_diagnostic`, `diagnostic_start_count` 필드 추가
- `backend/app/agent/nodes/intent_classifier.py` — 진단 시작 감지, diagnostic_start_count 스냅샷
- `backend/app/agent/nodes/drill_node.py` — 진단 진행률 표시 (`N/8`)
- `backend/app/agent/nodes/diagnose_node.py` — 초기 진단 완료 메시지, 경고 조건부 표시
- `backend/app/agent/graph.py` — adaptive_difficulty_router 진단 카운터 로직
- `backend/app/agent/tools/explain_tools.py` — 프롬프트 개선, 후처리 강화
- `backend/app/api/chat.py` — is_diagnostic, diagnostic_start_count INITIAL_STATE 추가

---

### ✅ 13주차 (완료)

**[사전 준비] 완료**
- [x] 모바일 레이아웃 수정
  - 모바일 드로어 사이드바 추가 (commit `33a0c9c`)
  - 가로/세로 스크롤바 제거 (commit `56fe409`)
  - iOS 입력창 자동 줌인 제거 (commit `3e2d27f`)
  - 입력창 placeholder 줄바꿈 수정 (commit `c432959`)
- [x] 문제 은행 보완 — 110문제 → 220문제로 확장 완료
  - 기출 기반 13문제 추가 (commit `33a0c9c`): CASE WHEN/DECODE, 반정규화, ROWNUM, MERGE, NTILE 등
  - q136~q220 추가 생성 — 계층형 쿼리·WINDOW·GROUP BY·JOIN·NULL/CASE·서브쿼리·PIVOT·MERGE·VIEW·트랜잭션·인덱스·정규화·DDL·트랩형 (방법A+B 혼합, `docs/add_questions_batch1~4.py`)
  - q032/q033 보기 마크다운 테이블 형식으로 수정 (commit `08dbb55`)
  - q151 보기 4번 설계 오류 수정 (직접 모순 → 윈도우 함수 중첩 금지 지식형 문제로 교체)

**산출물 위치:** `docs/week12/` (커밋 완료 `bba9311`)
- `gate3_checklist.md` — Gate 3 통과 기록 (2026-06-10 확정)
- `usability_test_report.md` — 사용성 테스트 1·2차 결과

**버그 수정 (2026-06-17)**
- SQL 모드 안내 메시지 개선 — 에러 메시지 → 예시 포함 친절한 안내로 교체 (commit `a0eb3e5`)
- 테이블 목록 불릿 줄바꿈 수정, 컬럼명 실제 스키마 기준으로 수정, Oracle 클래식 뷰 안내 추가
- 문제 포맷 수정 7건 — 텍스트 테이블 → 마크다운 테이블, SQL → 코드 블록 변환 (commit `df92820`)

**버그 수정 (2026-06-18)**
- pending 중 비숫자 입력 차단 — 문제가 나온 상태에서 개념 질문 등 숫자 외 입력 시 explain/chat 대신 drill로 강제 라우팅, drill_node가 "현재 문제에 먼저 답해주세요 (1~4번)" 안내 (commit `730261e`)
  - 근본 원인: `current_mode`가 "explain"인 상태에서 숫자 입력 시 explain_node로 라우팅 → 채점 없이 개념 설명만 반복 → 진단 카운터 미증가 → 진단 멈춤 현상
- pending 재출력 UI 일치 수정 — 비숫자/범위 밖 숫자 입력 시 재출력되는 문제에 `N/8 진단 중` 표시 및 카테고리·난이도 칩 유지 (`_diag_seq` 필드를 pending_question에 저장하여 재출력 시 복원, commit `9180f34`)

**기능 추가 (2026-06-18)**
- 목표 점수 + 진단 결과 기반 자동 난이도 조정 (commit `f805a49`)
  - 진단 8문제: target_score 기반 가중치 랜덤 선택 (60점→하/중, 70점→하/중/상, 80점→중/상, 90점→중/상 위주)
  - 진단 후: 카테고리별 정답률(accuracy_by_category) 기반 자동 결정 (70%↑→상, 40~70%→중, 40%↓→하)
  - 데이터 부족(시도 0회) 시 target_score 폴백, 사용자 명시 난이도는 항상 우선
  - `_auto_difficulty(state, category, is_diagnostic)` 헬퍼 함수 추가, `_TARGET_DIFF_WEIGHTS` 가중치 테이블 추가

**교수님 결정사항 (2026-06-17)**
- 진단 문제 수: 8문제 유지 확정
- Render 유료 전환($7/월): 진행 후 영수증 드리기로 결정
- 사례금(1인당 5,000원): 본인이 직접 부담
- 문제 은행 220문제 확장: 교수님께 보고 예정

**[본 일정] 비공개 베타 출시 + 첫 5명 모집 (핸드북 기준)**
- [x] 베타 사용자 모집 — 3명 진행 중, 1명 시험기간 이후 참여 예정, 1명 미확보
  - ✅ 교수님 소개 3명 — 앱 링크 + 안내 메시지 발송 완료, 카톡으로 소통 중 (2026-07-03 첫 피드백 요청)
  - ⏳ 1명 — 시험기간 아닐 때 참여하겠다고 보류
  - ❌ 1명 미확보 (5명 기준 미달이나 3명으로 진행)
- [x] 온보딩 — 앱 링크 + 사용 방법 안내 + 데이터 수집 설명 + 피드백 항목 6가지 메시지로 발송 (대면 온보딩 대신 메시지로 대체)
- [x] 1:1 카카오톡으로 소통 중 (매주 금요일 피드백 요청 예정)
- [ ] 매주 평균 3시간 이상 사용 유도 (진행 중)

**산출물 위치:** `docs/week13/`
- `beta_feedback_round1.md` — 베타 피드백 1차 (2026-07-03, 2명)

---

### 🔄 14주차 (진행 중)

**1차 피드백 대응 (2026-07-05~12)**
- [x] `_DRILL` 부정 표현 오분류 수정 — "문제주지마" 입력 시 문제 출제 버그
- [x] 카테고리 전환 후 문제 자동 출제 — `adaptive_difficulty_router` suggest_category_switch 미확인 버그
- [x] "모르겠다" 입력 시 갑자기 문제 전환 버그 (진단·일반 모드 각각 수정)
- [x] "2 2 3 4" 다중 번호 입력 → 첫 숫자만 추출해 정답 처리 버그
- [x] 메시지 전송 후 입력창 포커스 해제 버그
- [x] 재로그인 시 동일 문제 정답 판정 불일치 — stale 체크포인트 race condition 수정
- [x] 로그아웃 후 재로그인 시 풀이 기록 소실 — PostgresSaver 연결 복구
- [x] 보기 버튼 클릭으로 답 선택 (UX, 3명 공통 요청)
- [x] 오답 회고 기능 — 풀이 기록 조회 UI (`wrong-answers/page.tsx`)
- [x] 예상 점수 표시 — 카테고리 정답률 기반 SQLD 점수 추산 (사이드바)
- [x] 네트워크 오류 시 재시도 버튼
- [x] 채점 후 추가 질의 시 새 문제 출제 오분류 — `follow_up_mode` 도입
- [x] `_CATEGORY_ALIASES` 14개 → 75개 확장, 카테고리 지정 시 난이도 폴백 추가
- [x] RAG 학습 데이터 팩트 오류 14건 수정 + Chroma DB 클린 재빌드
- [x] 개념 설명 이중 출력 버그 (`on_chat_model_stream` chatbot 노드만 필터링)
- [x] "SQL Server" 개념 질문 → SQL 실행 모드 오라우팅 수정
- [x] 회원가입 후 자동 로그인 미지원 수정
- [x] 계정 관리 화면 추가 — 비밀번호 변경·회원탈퇴
- [x] ~합니다체/~해요체 문법 혼용 수정 (노드 4개 + 프롬프트 2개)
- [x] `demo-user-1` 하드코딩 보안 이슈 수정
- [x] Supabase JWT 기반 API 인증 도입 (thread_id ≠ user_id 403 차단)
- [x] UI 디자인 시스템 도입 — stone/amber 팔레트, 전체 컴포넌트 통일
- [x] 입력창 위 제안 칩 4개 추가 (문제 풀기 / 약점 분석 / 오답 복습 / 틀린 개념 복습)
- [x] pending_question SSE 이벤트 추가 — 클라이언트 캐시로 체크포인트 경쟁 조건 우회 (보기 버튼 클릭 딜레이 제거)
- [x] 로딩 dots 버블 제어 — React 18 배칭 이슈 수정, 불필요한 dots 제거

**2차 피드백 (2026-07-16) + 대응 (2026-07-17~19)**
- [x] 진단 8문제 도중 이탈 후 재접속 → amber 배너 + "이어서 풀기" 버튼 (QA-1 시나리오1)
- [x] 진단 완료 후 재시작 차단 — `is_diagnostic_done` + `diagnostic_block_node` (QA-1 시나리오2)
- [x] 오답 복습 시 진단 중 문항 재출제 — `state_updater`에서 진단 구간 오답 `recent_mistakes` 제외 (QA-2)
- [x] 채점 후 "다음 문제 →" 버튼 추가 (QA-4)
- [x] `follow_up_mode`에서 오답 복습/약점 분석 즉시 허용 (QA-7)
- [x] 오답 복습 선택지 버튼 미표시 + 비숫자 입력 안내 (QA-10)
- [x] 진단 완료 재요청 시 빈 버블 — `diagnostic_block`을 `NON_LLM_NODES`에 추가 (QA-9)
- [x] 보기 `0~1 사이` 범위 표현 취소선 오표시 — `singleTilde: false` (QA-16a)
- [x] 개념 설명 볼드 남발·이탤릭 무분별 사용 → SQLD 키워드 화이트리스트 후처리 (QA-16b)
- [x] 오답 후 자동 개념 설명 미트리거 — `client_pending_question` race condition 수정
- [x] 회원 탈퇴 400 오류 — Next.js Server Route + Admin API 방식으로 재구현

**내부 디버깅 (2026-07-20)**
- [x] BUG-02: `chat.py` 분석 이벤트에 `req.user_id` 대신 JWT `user_id` 사용
- [x] BUG-03: `mini_chat.py` 인증 미적용 → `Depends(get_current_user_id)` 추가
- [x] BUG-04: `_DRILL` 정규식 오매칭 — "풀어"/"시작" 독립 매칭 제거
- [x] BUG-05: `_ANSWER_RE` 과잉 매칭 — `^[1-4]번?\s*$`로 전체 매칭 강제
- [x] BUG-06: `_try_result_table` Pattern 1b 한국어 단일 쌍도 테이블 변환 — `>= 2` 조건으로 수정
- [x] BUG-07: `checkpointer.py` MemorySaver fallback 시 `logging.error`로 격상
- [x] BUG-08: `wrong_answers.py` `int(k)` `ValueError` 미처리 → try/except 추가
- [x] BUG-09: `progress.py` `total - start` 음수 가능 → `max(0, ...)` 적용
- [x] BUG-10: `INITIAL_STATE`에 `wrong_answer_log`, `last_wrong_tags` 누락 필드 추가
- [x] debug 로그 제거 — `traceback.print_exc()` (chat.py), `console.error` (page.tsx)

**QA-3 해결 (2026-07-20)**
- [x] QA-3: AI 튜터 개인화 피드백 미작동 → 3단계로 해결
  - `prompts.py` — `_CATEGORY_WEIGHTS` 추가, `_calc_predicted_score()` 구현, chatbot 시스템 프롬프트에 `target_score`·`예상 점수`·`카테고리별 정답률+풀이 수`·`누적 정답 수` 주입 (commit `4cc0792`, `0b9cf3e`)
  - `Sidebar.tsx` — 1과목 가중치 오류 수정: `0.40/2` → `0.20/2` (SQLD 실제 1과목 20%, 2과목 80%), 사이드바 예상 점수 32점 → 27점으로 정정 (commit `059d772`)
  - AI hallucination 방지 — `attempts_by_category`·`total_correct` 프롬프트 명시 + "직접 계산하지 말 것" 지시 → 총 풀이 수 32→44, 정답 수 6→8로 정정

**추가 수정 (2026-07-22)**
- [x] 오답 시 개념 설명 접기/펼치기 UI — 300자 초과 시 5줄 미리보기 + 그라데이션 페이드 + "더 보기 ▼/접기 ▲" 토글, 개념 버블 내 "다음 문제" 버튼 배치 (commit `36cc21a`)
- [x] explain_tools.py — "안녕하세요" 인사말 금지 지시 추가, "다음 문제를 풀려면 문제 줘" 힌트 제거 (사용자가 직접 입력하거나 버튼으로 진행 가능), "더 궁금한 개념은 직접 입력하세요" 유지 (commit `6b03149`)
- [x] 개념 버블 토글 버튼 isAnswered 버그 수정 — 다음 메시지 전송 후 "접기 ▲/더 보기 ▼" 버튼이 사라지는 문제, 외부 조건을 `(isLong || 다음문제조건)`으로 분리하여 토글은 항상 표시 (commit `8045c41`)

**QA 항목 최종 처리 결과**

| 항목 | 처리 | 방식/이유 |
|------|------|-----------|
| QA-5 | ✅ 대안 해결 | 입력 잠금 → "해설 건너뛰기" 버튼으로 대체. 해설 길이 → 개념 버블 "더 보기 ▼"로 대체 |
| QA-6 | ⏭ 의도적 패스 | 타 AI(ChatGPT 등)도 채팅창에 직접 입력하는 구조. 유저가 궁금한 것을 직접 입력하는 게 정상 UX |
| QA-8 | ✅ 대안 해결 | 채팅창 옆 SQL 플레이그라운드 패널 추가 (PC 전용, 토글 가능) |
| QA-11 | ⏭ 장기 검토 패스 | 구현 복잡도 대비 실사용 빈도 낮음, 입력창에 다른 요청 입력 시 자연스럽게 전환 가능 |
| QA-12 | ⏭ 장기 검토 패스 | SQL 플레이그라운드 패널이 사이드에 있어 문항 보면서 실행 가능. 인라인 통합은 복잡도 대비 이득 낮음 |
| QA-13 | ✅ 해결 | `stats_updated` SSE 이벤트로 채점 즉시 사이드바 실시간 반영 |
| QA-14 | ⏭ 장기 검토 패스 | 스트리밍 안정성은 Render 인프라 의존도 높음. 간헐적 끊김이며 재시도 버튼으로 대응 가능 |
| QA-15 | ⏭ 장기 검토 패스 | 보기 버튼 클릭으로 답 선택 가능해져 입력창 사용 빈도 줄었음. 최소화 UI는 복잡도 대비 이득 낮음 |
| QA-17 | ⏭ 장기 검토 패스 | prompts.py에 실제 통계 주입 + "직접 계산하지 말 것" 지시로 완화. LLM 특성상 완전 제거 불가, 허용 범위로 판단 |

**산출물 위치:** `docs/week14/`
- `beta_feedback_round2.md` — 베타 피드백 2차 (2026-07-16, 3명 + QA 전문가)
- `bug_fix_log_round1.md` — 1차 피드백 대응 수정 이력 (25건)
- `bug_fix_log_round2.md` — 2차 피드백 대응 수정 이력 (14건)
- `14주차_개선보고서.docx` — 개선 보고서

---

## 주요 페인포인트 (인터뷰 기반)

1. **취약점 파악 어려움** — 어디가 약한지 모름 (4건)
2. **개념→문제 적용 갭** — 알아도 문제에 적용 못함 (4건)
3. **오답 복습 비효율** — 틀린 문제 재복습 체계 없음 (3건)
4. **해설 불충분** — 왜 틀렸는지 이해 안 됨 (3건)
5. **공부 방향 불확실** — 뭘 먼저 해야 할지 모름 (1건, 추가 검증 필요)

---

## 문제 확장 이력 및 향후 보완 우선순위

> **현재 상태 (2026-06-16):** 총 220문제  
> **배경:** `docs/reference/2024개정판_SQLD_개념정리.pdf` (103p) 전수 분석 결과 도출 (2026-05-25)

### 확장 이력
- **110문제** — 2주차 초기 생성 (11카테고리 × 10문제)
- **+13문제** — 13주차 기출 기반 즉시 추가 (CASE WHEN/DECODE, 반정규화, ROWNUM, MERGE, NTILE 등)
- **+97문제** — 13주차 Method A+B 혼합 확장 (계층형 쿼리, WINDOW, GROUP BY, JOIN, NULL/CASE, 서브쿼리, PIVOT, MERGE, VIEW, 트랜잭션, 인덱스, 정규화, DDL, 트랩형)
- **현재 220문제** — 베타 피드백 후 350문제까지 단계적 확장 예정

### 향후 추가 권고 (베타 피드백 기반, 350문제 목표)
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
