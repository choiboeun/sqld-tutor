# 버그 수정 로그 (14주차)

**기준:** 1차 베타 피드백 (2026-07-03) → [beta_feedback_round1.md](../week13/beta_feedback_round1.md)

---

## 버그 목록 및 상태

| # | 증상 | 원인 | 파일 | 상태 |
|---|------|------|------|------|
| 1 | "문제주지마" 입력 시 문제 출제됨 | `_DRILL` 정규식이 부정 표현을 구분하지 못함 | `intent_classifier.py` | ✅ 완료 (2026-07-05) |
| 2 | 카테고리 전환 안내 후 문제가 자동으로 나오지 않음 | `adaptive_difficulty_router`가 `suggest_category_switch` 상태를 확인하지 않음 | `graph.py` | ✅ 완료 (2026-07-05) |
| 3 (진단) | "모르겠다" 진단 중 — 갑자기 문제 전환 | chatbot 도구 오발동 + 진단/일반 미분기 | `drill_node.py` | ✅ 완료 (2026-07-05) |
| 3 (일반) | "모르겠다" 일반 모드 — 순서·안내 오류 | 질문→설명 순서, explain_concept trailing 안내 맥락 불일치 | `drill_node.py` | ✅ 완료 (2026-07-06) |
| 4 | "2 2 3 4" 등 다중 번호 입력 시 정답 처리 | `_ANSWER` 정규식이 첫 번째 숫자만 추출 | `drill_node.py` | ✅ 완료 (2026-07-05) |
| 5 | 메시지 전송 후 입력창 포커스 해제 | `sendMessage` 이후 포커스 복원 코드 없음 | `chat/page.tsx` | ✅ 완료 (2026-07-05) |
| 6 | 같은 문제 정답 판정 불일치 | 두 번째 astream_events가 stale 체크포인트 읽어 채점 오류 | `chat/page.tsx` | ✅ 완료 (2026-07-08) |
| 7 | 로그아웃 후 재로그인 시 풀이 기록 사라짐 | sync 단일 연결 유휴 끊김 → MemorySaver fallback → AsyncPostgresSaver 컨텍스트 오류 | `checkpointer.py`, `api/chat.py` | ✅ 완료 (2026-07-07) |
| UI-1 | 보기 일부만 코드 박스 (WITH 오감지) | `WITH GRANT OPTION` 등이 SQL 구문으로 오분류됨 | `drill_node.py` | ✅ 완료 (2026-07-06) |
| UI-2 | 보기 번호가 context 번호목록과 혼동 | `1. 2. 3.` 형식이 업무규칙 번호와 동일 | `drill_node.py` | ✅ 완료 (2026-07-06) |
| UX-1 | 보기 버튼 클릭으로 답 선택 | 텍스트 입력만 지원 (3명 공통 요청) | `chat/page.tsx` | ✅ 완료 (2026-07-06) |
| UX-2 | 오답 회고 기능 부재 | 풀이 기록 조회 UI 없음 | `chat/page.tsx`, `api/wrong_answers.py` | ✅ 완료 (2026-07-06) |
| UX-3 | 예상 점수 표시 없음 | 카테고리별 정답률만 있고 종합 점수 없음 | `components/Sidebar.tsx`, `api/progress.py` | ✅ 완료 (2026-07-08) |
| UX-4 | 네트워크 오류 시 재시도 불가 | 오류 메시지가 채팅 버블로 삽입되어 재전송 방법 없음 | `chat/page.tsx` | ✅ 완료 (2026-07-09) |
| UX-5 | 채점 후 추가 질의 시 새 문제 출제됨 | `intent_classifier`가 "이 문제에 대해서"의 "문제" 키워드를 새 문제 요청으로 오분류, explain_node는 last_category 기준으로 엉뚱한 개념 설명 | `intent_classifier.py`, `drill_node.py`, `review_node.py`, `state.py` | ✅ 완료 (2026-07-09) |
| UX-6 | 문제 대기 중 막혔다는 느낌 — 사용자 이탈 유발 | "현재 문제에 먼저 답해주세요" 안내가 출구 없는 느낌을 줘 다른 AI로 이탈 | `drill_node.py` | ✅ 완료 (2026-07-10) |
| UX-7 | 안내 메시지가 4번 보기 안에 섞여 표시됨 | `parseOptions`의 `\s*$` 정규식이 note 있으면 "번호로 답하세요." 제거 실패 → ④ 끝이 `paras.length`라서 note 전체가 ④ 버튼 내용에 포함됨 | `chat/page.tsx` | ✅ 완료 (2026-07-10) |
| QA-2 | 요청한 카테고리 대신 랜덤 문제가 출제됨 | `_CATEGORY_ALIASES`에 자연어 키워드 14개만 있어 대부분의 입력이 None 반환 → 랜덤 카테고리 선택. 카테고리 지정 시 자동 난이도 문제 없으면 폴백 없이 오류 메시지 반환 | `drill_node.py` | ✅ 완료 (2026-07-10) |
| QA-4 | RAG 개념 설명이 문제 정답과 어긋남 | RAG 학습 데이터(docs/week7) 6개 파일에 팩트 오류 14건 — 스칼라 서브쿼리 사용 위치 단정, NULL 비교 FALSE/UNKNOWN 혼용, Oracle (+) 위치, PRIOR 방향 레이블 뒤바뀜, SQL Server 지원 여부 오기 등 | `docs/week7/*.md` + Chroma DB | ✅ 완료 (2026-07-10) |
| QA-4b | Chroma DB 중복 적재 — 구버전 청크가 검색에 노출됨 | `build_index.py` 재실행 시 기존 컬렉션을 삭제하지 않고 추가만 해 678개(226×3) 중복 적재. 구버전 팩트 오류 청크가 신버전과 혼재하여 RAG 수정이 반영되지 않는 경우 발생 | `ingestion/build_index.py` | ✅ 완료 (2026-07-10) |
| QA-4c | 개념 설명(explain) 답변이 두 번 출력됨 | `on_chat_model_stream` 필터가 `node not in {"explain"}`이라 explain 내부 LLM 호출의 `langgraph_node` 메타데이터가 `""`로 넘어올 경우 토큰 스트리밍이 통과 → 토큰 버블 + on_chain_end 버블 이중 출력 | `backend/app/api/chat.py` | ✅ 완료 (2026-07-10) |
| QA-4d | "SQL Server" 개념 질문이 SQL 실행 모드로 라우팅됨 | `_SQL` 패턴의 `sql\b`가 "LAG 함수 **SQL** Server에서 쓸 수 있어?" 속 SQL도 감지 → sql 실행 모드 진입 → "방금 실행해봤는데…" hallucination 응답 | `backend/app/agent/nodes/intent_classifier.py` | ✅ 완료 (2026-07-10) |
| QA-10a | 회원가입 후 자동 로그인 미지원 | `signUp()` 반환값 `data`를 무시해 세션이 즉시 발급돼도 "이메일 확인" 화면만 표시 | `frontend/app/(auth)/signup/page.tsx` | ✅ 완료 (2026-07-10) |
| QA-10b | 인증 이메일 Supabase 기본 영문 템플릿 | Supabase 기본 이메일 — 영문, Supabase 브랜딩, "Confirm your email address" 제목 | Supabase Dashboard > Email Templates | ✅ 완료 (2026-07-10) |
| QA-12 | 계정 관리 화면 없음 — 비밀번호 변경·회원탈퇴 불가 | 로그인 후 계정 관련 기능 진입점 없음 | `frontend/app/chat/page.tsx` + Supabase SQL `delete_user()` | ✅ 완료 (2026-07-11) |
| QA-13 | ~합니다체/~해요체 문법 혼용 | 노드 문자열 리터럴 + LLM 프롬프트 모두 ~합니다체 섞임 | 노드 4개 + 프롬프트 2개 | ✅ 완료 (2026-07-12) |
| QA-14 | `demo-user-1` 하드코딩 보안 이슈 | `threadId` 초기값이 고정 문자열이라 getUser() 실패 시 여러 유저가 같은 체크포인트를 공유할 수 있음 | `chat/page.tsx`, `wrong-answers/page.tsx`, `Sidebar.tsx` | ✅ 완료 (2026-07-12) |
| 보고서 #5 | 문제마다 질문/오류신고 버튼 없음 | — | — | 보류 — 채팅 follow_up_mode로 대체 가능. 중요도 낮아 미구현 결정 |
| 보고서 #6 | 응답 지연 + 스켈레톤 로딩 없음 | — | — | 보류 — SSE 스트리밍으로 토큰 즉시 출력, dots 로딩 말풍선 존재. 스켈레톤 효과 제한적으로 판단 |
| 보고서 #9 | 첫 화면 안내 부족 — 빈 입력창만 있어 재방문 유저 멈춤 | 재방문 유저가 무엇을 입력해야 할지 모름 | `frontend/app/chat/page.tsx` | ✅ 완료 (2026-07-12) — 입력창 위 제안 칩 4개 추가 (문제 풀기 / 약점 분석 / 오답 복습 / 틀린 개념 복습) |
| 보고서 #9 (버그) | 제안 칩 클릭 시 개념 설명 대신 문제가 출제됨 | LangGraph 체크포인트에 `pending_question`이 남아있으면 `intent_classifier`가 모든 입력을 drill 강제 라우팅 — 4개 칩 전부 해당 | `backend/app/api/chat.py`, `frontend/app/chat/page.tsx` | ✅ 완료 (2026-07-12) — 칩 클릭 시 `clear_pending=true` 전달, 백엔드에서 `pending_question: {}` 초기화 후 정상 라우팅 |
| 보고서 #8 | 지난 대화 기록 화면 없음 | — | — | 보류 — 오답 회고(UX-2)로 대체. 개념 설명은 재질의로 동일 답변 가능. 합격 목적 앱에서 전체 대화 기록 필요성 낮음 |
| 보고서 #13 | 문항별 Oracle/SQL Server 문법 혼용 | — | — | N/A — SQLD 시험은 Oracle 단일 기준. 220개 문제 검토 결과 실제 혼용 없음. q070의 TOP은 오답 보기로 의도적 사용 |
| 보고서 #14 | 백엔드 API 서버 단 권한 검증 없음 | thread_id(= user_id)만 알면 누구나 타인의 학습 데이터 읽기·쓰기 가능 | `backend/app/auth.py`, `api/chat.py`, `api/progress.py`, `api/wrong_answers.py`, `frontend/lib/api.ts`, `chat/page.tsx`, `wrong-answers/page.tsx`, `Sidebar.tsx` | ✅ 완료 (2026-07-12) — Supabase JWT 검증 의존성 추가, 프론트 Authorization 헤더 포함 |
| UI-전체 | 앱 전체 디자인 바이브코딩 느낌 — 모든 버튼 blue-600, gray 배경 단조로움 | 색상 체계 없이 Tailwind 기본값 사용 | 프론트 전체 (`layout.tsx`, `login`, `signup`, `onboarding`, `Sidebar`, `chat/page`, `wrong-answers/page`) | ✅ 완료 (2026-07-12) — stone(중립)/amber(강조) 디자인 시스템 도입 |
| UX-딜레이 | 보기 버튼 클릭 딜레이 — done 이벤트까지 기다려야 클릭 가능 | PostgresSaver 체크포인트 저장 완료 후 done 이벤트 → Bug 6 방어용 설계이나 UX 저해 | `backend/app/api/chat.py`, `frontend/app/chat/page.tsx` | ✅ 완료 (2026-07-12) — pending_question SSE 이벤트 추가, 클라이언트 캐시 후 request body로 전달해 checkpoint 경쟁 조건 우회 |
| UX-로딩점1 | 답 선택 후 문제~2번 사이 불필요한 `...` 표시 | message 핸들러가 항상 빈 슬롯 추가 → done 전 버튼 클릭 시 두 슬롯이 동시에 `...`로 렌더 | `frontend/app/chat/page.tsx` | ✅ 완료 (2026-07-12) — isAnswered 조건으로 답변된 메시지 뒤 빈 슬롯 즉시 숨김 + 스트림 버전 관리로 구 스트림 done 간섭 방지 |
| UX-로딩점2 | 오답 해설 후 개념 설명 없을 때 불필요한 `...` 표시 | 채점 메시지 뒤 빈 슬롯이 done 올 때까지 남아 있음 | `frontend/app/chat/page.tsx` | ✅ 완료 (2026-07-12) — aiHasResponded=true이면 빈 슬롯 즉시 숨김 |

---

## 수정 상세

### Bug 1 — 부정 표현 오분류 (`intent_classifier.py`)

**수정 전:** `_DRILL` 정규식이 "문제주지마"에서 "문제" 키워드를 감지해 drill 모드 진입

**수정 내용:**
```python
# 추가된 패턴
_NEGATE_DRILL = re.compile(r"문제.{0,5}(주지마|하지마|싫|안\s*줘|필요\s*없)")

# 기존 elif _DRILL.search(text) 앞에 삽입
elif _NEGATE_DRILL.search(text):
    mode = "chat"
```

---

### Bug 2 — 카테고리 전환 후 문제 자동 출제 안 됨 (`graph.py`)

**수정 전:** `state_updater`가 `suggest_category_switch=True`를 세팅해도 `adaptive_difficulty_router`가 무시하고 END 반환

**수정 내용:**
```python
# adaptive_difficulty_router 최상단에 추가
if state.get("suggest_category_switch"):
    return "drill"
```

---

### Bug 4 — 다중 번호 입력 시 오정답 처리 (`drill_node.py`)

**수정 전:** `_ANSWER.search("2 2 3 4")` → "2" 추출 → 채점 진행

**수정 내용:**
```python
# match 확인 직후 삽입
if match and last_human:
    all_digits = re.findall(r"[1-4]", last_human.content)
    if len(all_digits) > 1:
        return {"messages": [AIMessage(content="1~4 중 하나만 입력해주세요 (예: 2 또는 2번).\n\n" + ...)]}
```

---

### Bug 5 — 전송 후 포커스 해제 (`chat/page.tsx`)

**수정 내용:**
```typescript
// useRef 추가
const inputRef = useRef<HTMLTextAreaElement>(null);

// textarea에 ref 연결
<textarea ref={inputRef} ... />

// sendMessage에서 전송 직후 포커스 복원
setInput("");
inputRef.current?.focus();
await streamChat(text, true);
```

---

### Bug 3 (진단) — "모르겠다" 입력 시 진단/일반 모드 분기 처리 (`drill_node.py`)

**원인:** `pending_question`이 있을 때 "모르겠어" 입력 시 chatbot 노드로 라우팅 → chatbot이 `generate_sqld_question` 도구로 설명 중 자체 문제 출제 + 진단/일반 모드 구분 없이 동일 처리

**수정 내용:**
- `_GIVE_UP` 패턴 추가: `모르겠|몰라|포기|모름`
- `drill_node` 내에서 포기 표현 감지 후 `is_diagnostic` 여부로 분기:
  - **진단 중:** "정확하지 않아도 괜찮으니 1~4번 중 골라보세요" 유도 메시지 + 같은 문제 재출력

---

### Bug 3 (일반) — "모르겠어" 일반 모드 순서·안내 오류 (`drill_node.py`)

**원인:**
1. 응답이 하나의 버블에 "질문→설명→안내" 순서로 나와 질문이 두 번 표시됨
2. `explain_concept` 프롬프트가 설명 끝에 "다음 문제를 풀려면 문제 줘" 를 자동 추가 → `pending` 상태에서 새 문제 요청 유도 (맥락 불일치)

**수정 내용:**
- 두 개의 `AIMessage`로 분리 반환:
  - **버블 1:** `explain_concept` 설명 (trailing "다음 문제를 풀려면..." regex로 제거)
  - **버블 2:** `_format_question(pending)` 재출력 (배지 정상 렌더) + "이해되셨나요? 다시 도전해봐요!"

---

### UI-1 — WITH 오감지로 보기 코드박스 불일치 (`drill_node.py`)

**원인:** `_SQL_IN_OPTION`에 `WITH` 포함 → `WITH GRANT OPTION`, `WITH ADMIN OPTION` 등 DCL 절이 SQL 구문으로 오분류 → 일부 보기만 코드박스, 나머지는 일반 텍스트

**수정:** `_SQL_IN_OPTION`에서 `WITH` 제거

---

### UI-2 — 보기 번호 ①②③④ 변경 (`drill_node.py`)

**원인:** `1. 2. 3. 4.` 형식이 context의 업무규칙 번호목록과 동일해 시각적 구분 어려움

**수정 내용:**
- `_CIRCLE = {1:"①", 2:"②", 3:"③", 4:"④"}` 매핑 추가
- `_format_question` 모든 보기 표시를 ①②③④로 변경
- `_ANSWER` 정규식에 ①②③④ 추가 (원형 번호 직접 입력도 채점 처리)
- `opts_block` 구분자 `\n\n`으로 통일

---

---

## 추가 수정 (2026-07-06 후반 ~ 2026-07-08)

### Bug 6 — 정답 판정 불일치 (`chat/page.tsx`) ✅

**원인:** 문제 버튼을 `message` 이벤트 직후 활성화 → 사용자가 빠르게 클릭하면 두 번째 `astream_events`가 체크포인트 저장 전 상태를 읽어 채점 오류 발생 (체크포인트 경쟁 조건).

**수정:** `done` 이벤트(그래프 실행 + 체크포인트 저장 완료) 이후에만 버튼 활성화. `isLoading` 게이트를 `message`가 아닌 `done`에서 해제. `f2df0ea`

---

### Bug 7 — 재로그인 기록 소실 전체 수정 여정 (`checkpointer.py`)

**1차 수정 (2026-07-06):** `ConnectionPool(min_size=1, max_size=5)` 교체로 유휴 끊김 문제 해결 시도.

**문제 지속:** Supabase Session pooler 환경에서 `AsyncPostgresSaver`가 동기 컨텍스트에서 생성되어 `NotImplementedError` 발생 → MemorySaver fallback 반복.

**최종 수정 (2026-07-07):** `AsyncPostgresSaver`를 FastAPI `lifespan` async 컨텍스트 안에서 생성, `setup()` 호출에만 autocommit 연결 사용, pool은 일반 트랜잭션 모드 유지. `ee649fa`

추가로 `progress`, `wrong_answers` API의 동기 `get_state` → 비동기 `aget_state`로 교체. `3eddae0` `a29dd9f`

---

### UX-1 — 보기 버튼 클릭으로 답 선택 (`chat/page.tsx`) ✅

3명 공통 요청 핵심 기능. `parseQuestionHeader`로 문제 감지 후 ①②③④ 보기를 클릭 가능한 버튼으로 렌더링. 이미 답한 문제는 버튼 비활성화. 로딩 중 pulse 애니메이션(bg-gray-100) 으로 활성화 대기 시각화. `bb02c39` `d0a00da`

---

### UX-6 — 문제 대기 중 안내 메시지 개선 (`drill_node.py`) ✅

**배경:** QA 리포트에서 "번호를 아무거나 입력해 틀리는 방법으로만 다음으로 넘어갈 수 있었다"는 지적. 기능 자체 문제가 아니라 메시지가 출구 없는 느낌을 줘 사용자가 패닉하고 이탈하는 것이 원인.

**설계 판단:** 문제 대기 중 개념 설명을 허용하면 미리 알아버려 학습 효과(Productive Failure)가 떨어짐. 코드 변경 없이 메시지만 바꿔 학습 철학은 유지하되 심리적 막힘만 해소.

**수정 내용:**
- 수정 전: `"현재 문제에 먼저 답해주세요 (1~4번)."`
- 수정 후: `"모르겠다면 일단 1~4번 중 하나를 찍어보세요! 틀려도 괜찮아요, 풀고 나서 해설로 배울 수 있어요."`
- `d4afa36` (2026-07-10)

---

### UX-5 — 채점 후 추가 질의 라우팅 (`intent_classifier.py`, `drill_node.py`, `review_node.py`, `state.py`) ✅

**증상:**
- "이 문제에 대해서 자세하게 설명해줄 수 있어?" → 새 문제 출제
- "이해하기 쉽게 설명해줘" → 엉뚱한 카테고리 개념 설명

**원인 (두 가지):**
1. `_DRILL` 패턴이 `문제\s*(줘|내줘|...)?` 형태라 suffix가 optional → "이 **문제**에 대해서"에서도 drill로 오분류
2. drill을 피해도 `explain_node`가 `last_category` 값 기준으로 방금 틀린 문제와 무관한 개념을 설명

**수정 내용:**
- `state.py`: `follow_up_mode: bool` 필드 추가
- `drill_node.py` / `review_node.py`: 채점 완료 시 `"follow_up_mode": True` 반환
- `intent_classifier.py`:
  - `_DRILL_EXPLICIT` 패턴 추가 (suffix 필수 — bare "문제" 제외): `문제\s*(줘|내줘|풀게|풀어|주세요)|다음\s*문제|새\s*문제`
  - `follow_up_mode` 활성 시 `_DRILL_EXPLICIT` 감지되면 drill + 모드 리셋, 그 외 모든 메시지는 chatbot 라우팅
  - chatbot은 대화 히스토리 전체를 보므로 방금 틀린 문제 맥락으로 답변 가능
- `chat.py`: INITIAL_STATE에 `"follow_up_mode": False` 추가
- `408ac93` (2026-07-09)

---

### UX-4 — 네트워크 오류 재시도 배너 (`chat/page.tsx`) ✅

**기존 동작:** SSE 오류 이벤트 발생 시 "오류가 발생했습니다." 텍스트를 AI 채팅 버블로 삽입 → 스크롤 위로 올라가면 배너가 보이지 않아 재전송 방법 없음.

**수정 내용:**
- `networkError` state + `lastUserMessageRef` ref 추가
- `streamChat` 시작 시 `setNetworkError(false)`, `lastUserMessageRef.current = message` 저장
- SSE `error` 이벤트 및 `catch` 블록: 빈 AI 플레이스홀더만 제거하고 `setNetworkError(true)` 호출 (부분 스트리밍된 내용은 유지)
- 채팅 영역과 입력창 사이에 고정 배너 UI 표시:
  - 빨간 배경 + "연결 오류가 발생했습니다." 텍스트
  - "↺ 다시 시도" 버튼 → `streamChat(lastUserMessageRef.current, false)` 호출
  - 새 메시지 전송 시 자동으로 배너 사라짐
- `ea29943` (2026-07-09)

---

### UX-3 — 예상 점수 표시 (`components/Sidebar.tsx`, `api/progress.py`) ✅

SQLD 시험 과목 비율(1과목 40% / 2과목 60%)을 고정 가중치로 사용.
각 과목 내 카테고리는 균등 분배 (1과목 2개 → 각 20%, 2과목 9개 → 각 6.67%).
`accuracy_by_category` 정답률에 가중치를 곱해 합산 후 × 100 = 예상 점수.
목표 점수(온보딩 선택값)와 차이(+N / -N점)도 함께 표시. `ad88ede` `357eeda`

---

### UX-2 — 오답 회고 기능 (`chat/page.tsx`, `api/wrong_answers.py`) ✅

사이드바 하단 "오답 회고" 버튼 → 슬라이드업 패널로 오답 목록 표시. 각 문제 클릭 시 미니채팅 모달로 AI 해설 재질의 가능. `wrong_answers` 전용 엔드포인트 분리, 채팅 스크롤 위치 복원 포함. `f2f8484` `6349332`

---

### 추가 UX·안정성 수정 (2026-07-07~08)

| 커밋 | 내용 |
|------|------|
| `ec1251c` | 신규 회원 진단 시작 전 전용 안내 메시지 (채팅 첫 화면 안내 개선) |
| `9bf0d07` | 새로고침 시 진단 문제 중복 출제 방지 |
| `183de13` | 문제 `message` 이벤트 도착 즉시 버튼 잠금 해제 (done 전 미리 표시) |
| `c5cc4b8` | 문제 출제 후 불필요한 로딩 버블 제거 |
| `f71b631` | 채팅 메시지 sessionStorage 유지 (새로고침 시 복원) |
| `476a176` | 오답 복습 정답 시 `wrong_answer_log`에서도 제거 |
| `7b22c6d` | SSE `error` 이벤트 처리 추가 + 오답 피드백 형식 통일 |
| `893af68` | analytics 이벤트 루프 블로킹 → daemon thread 분리, 온보딩 에러 처리 추가 |
| `25d8c1b` | context 단일 줄바꿈이 마크다운 공백으로 처리되는 문제 수정 |
| `7b1d8b0` | SQL 키워드 뒤 한글이 오는 보기 코드 블록 오감지 수정 |
| `e65879d` | context 정규화 시 마크다운 테이블·코드 블록 깨짐 수정 |
| `c1144f9` | `review_node` `last_grade_result`에 `student_answer` 누락 수정 |
| `61d5f6d` | 메시지 딜레이 중 dots 로딩 말풍선 표시 |
| `e9dc9a6` | 문제 말풍선 후 dots 숨김 (사용자 혼동 방지) |
| `d0a00da` | 버튼 pulse 가시성 개선 (opacity 충돌 → bg-gray-100 방식) |
| `fb73d09` | tsconfig `es5` → `ES2017` (TypeScript 6.0 deprecation 해소) |
| `02b9498` | 버그 A–H 일괄 수정 (세션 중 발견) |

---

### QA-4b — Chroma DB 클린 재빌드 (`ingestion/build_index.py`) ✅

**원인:** `build_index.py`가 `Chroma.from_documents()` 실행 시 기존 컬렉션을 삭제하지 않고 문서를 추가만 함. 3회 실행으로 678개(226×3) 중복 적재 → 구버전 팩트 오류 청크가 검색에 혼재.

**수정 내용:**
```python
import shutil
if CHROMA_DIR.exists():
    shutil.rmtree(CHROMA_DIR)
```
실행마다 기존 디렉터리 삭제 후 재빌드. 226개 단일 버전으로 정리. `fa7b34f`

---

### QA-4c — explain 이중 출력 버그 (`backend/app/api/chat.py`) ✅

**원인:** `on_chat_model_stream` 필터가 `node not in {"explain"}`이었으나, explain_node 내부 `@tool`에서 호출된 LLM의 이벤트는 `metadata["langgraph_node"]`가 `""`(빈 값)로 넘어와 필터를 통과 → 토큰 스트리밍(버블 1) + `on_chain_end` 메시지(버블 2) 이중 출력.

**수정 내용:**
```python
# 수정 전
elif kind == "on_chat_model_stream" and node not in {"explain"}:
# 수정 후
elif kind == "on_chat_model_stream" and node == "chatbot":
```
chatbot 노드 토큰만 명시적으로 허용. `b56a88c`

---

### QA-4d — SQL 라우팅 오분류 (`intent_classifier.py`) ✅

**원인:** `_SQL = re.compile(r"SELECT\b|실행|쿼리|돌려|sql\b", re.IGNORECASE)`의 `sql\b`가 "LAG 함수 **SQL** Server에서 쓸 수 있어?" 속 "SQL"도 감지 → sql 실행 모드 라우팅 → "방금 EMP 테이블에서 실행해봤는데…" hallucination 응답.

**수정 내용:**
```python
# 수정 전
_SQL = re.compile(r"SELECT\b|실행|쿼리|돌려|sql\b", re.IGNORECASE)
# 수정 후
_SQL = re.compile(r"SELECT\b|실행|쿼리|돌려", re.IGNORECASE)
```
`SELECT`, `실행`, `쿼리`, `돌려`로 실제 실행 의도 충분히 커버. `a99f32b`

---

### QA-12 — 계정 관리 모달 (`chat/page.tsx`) ✅

**원인:** 로그인 후 비밀번호 변경·회원탈퇴 기능 진입점 없음. 기존 헤더에 로그아웃 텍스트 버튼만 존재.

**수정 내용:**
- 헤더 오른쪽 로그아웃 버튼 → **👤 내 계정** 텍스트+아이콘 버튼으로 교체
- 클릭 시 드롭다운: 이메일 표시 / 계정 설정 / 로그아웃
- 계정 설정 클릭 시 모달: 비밀번호 변경 + 회원 탈퇴(2단계 확인)
- Supabase SQL Editor에서 `delete_user()` 함수 생성 (`security definer`)
- 비밀번호 변경: `supabase.auth.updateUser({ password })`
- 회원 탈퇴: `supabase.rpc("delete_user")` → signOut → `/login` 이동
- `560052b`

---

### QA-14 — `demo-user-1` 하드코딩 보안 이슈 ✅

**원인:** `threadId`의 초기값이 `"demo-user-1"`로 하드코딩되어 있어, `getUser()` 응답 실패 시 실제 유저 ID 대신 `"demo-user-1"`로 LangGraph 체크포인트가 저장됨. 여러 유저가 같은 `thread_id`를 공유하면 타인의 대화 기록이 노출될 수 있음.

**수정 내용:**

| 파일 | 변경 내용 |
|------|-----------|
| `chat/page.tsx` | `threadId` 초기값 `"demo-user-1"` → `null` (`string \| null`) |
| `chat/page.tsx` | `getUser()` 유저 없을 시 `setSessionReady(true)` 제거 + `/login` 리다이렉트 추가 |
| `chat/page.tsx` | `threadId === "demo-user-1"` 조건 3곳 → `!threadId` 로 교체 |
| `wrong-answers/page.tsx` | 동일하게 `null` 초기화 + 조건 교체 |
| `Sidebar.tsx` | `threadId` prop 타입 `string \| null` 허용, `!threadId` 시 fetch 스킵 |

`f8c4c9a`

---

### QA-13 — ~합니다체/~해요체 문법 혼용 수정 ✅

**원인:** 노드 문자열 리터럴에 ~합니다체("없습니다", "오류가 발생했습니다" 등)가 산재해 있었고, LLM 지시문(`prompts.py`, `explain_tools.py`)에도 체계 지정이 없어 LLM이 ~합니다체를 자유롭게 사용.

**수정 범위:**

| 파일 | 변경 내용 |
|------|-----------|
| `sql_node.py` | "SELECT 문만 실행할 수 있습니다." → "…있어요." 외 2건 |
| `review_node.py` | "정답입니다!" → "정답이에요!" 외 3건 |
| `diagnose_node.py` | "풀이 데이터가 없습니다." → "…없어요." 외 2건 |
| `drill_node.py` | "조건에 맞는 문제가 없습니다." → "…없어요." |
| `prompts.py` | "한국어로 친절하게 답변하세요." → "~해요체로 일관되게 답변하세요. ~습니다체는 사용하지 마세요." |
| `explain_tools.py` | "한국어로 답변하세요." → "한국어로 ~해요체로 일관되게 답변하세요. ~습니다체는 사용하지 마세요." |

`1c70574`

---

### QA-10a — 회원가입 후 자동 로그인 (`signup/page.tsx`) ✅

**원인:** `supabase.auth.signUp()` 반환값에서 `data`를 무시하고 `error`만 확인. Supabase에서 이메일 확인 없이 세션이 즉시 발급되는 경우에도 `setDone(true)`로 "이메일 확인" 화면만 표시.

**수정 내용:**
```typescript
// 수정 전
const { error } = await supabase.auth.signUp({ ... })
if (!error) setDone(true);

// 수정 후
const { data, error } = await supabase.auth.signUp({ ... })
if (data.session) {
  router.push("/onboarding");  // 즉시 세션 발급 → 자동 로그인
} else {
  setDone(true);  // 이메일 확인 필요 → 안내 화면
}
```
`3cce983`

---

### QA-10b — 인증 이메일 한국어 브랜딩 (Supabase Dashboard) ✅

**원인:** Supabase 기본 이메일 템플릿 사용 — 영문 제목("Confirm your email address"), Supabase 기본 HTML.

**수정 내용:** Supabase Dashboard > Authentication > Emails > Confirm sign up 템플릿 교체
- Subject: `[SQLD 튜터] 이메일 인증을 완료해주세요`
- Body: SQLD 튜터 브랜딩 + 한국어 안내 + 버튼 스타일 적용

---

### QA-2 — 카테고리 alias 전면 보강 + 난이도 폴백 (`drill_node.py`) ✅

**증상:**
- "계층형 질의 문제 줘" → "데이터 모델과 SQL" 정규화 문제 출제 (alias 없어 랜덤)
- "윈도우 함수 문제 줘" → "조건에 맞는 문제가 없습니다" (난이도 자동 선택 후 폴백 없음)

**원인 A (alias 누락):** `_CATEGORY_ALIASES`에 14개 키워드만 있어 "계층형 질의", "union", "트랜잭션" 등 대부분의 자연어 입력이 `_parse_category()` → None → 랜덤 카테고리 선택.

**원인 B (난이도 폴백 없음):** 카테고리 지정 분기에서 자동 선택 난이도로 문제가 없으면 재시도 없이 바로 오류 메시지 반환. (카테고리 미지정 분기에는 폴백 로직 존재)

**수정 내용:**
- `_CATEGORY_ALIASES` 14개 → 75개로 확장 (11개 카테고리 전부 보강)
  - 서브스트링 충돌 방지 — 반정규화→정규화, 인라인 뷰→뷰, dense_rank→rank 순으로 배치
- 카테고리 지정 + 자동 난이도 → 문제 없으면 난이도 제거 후 재시도:
  ```python
  user_difficulty = _parse_difficulty(text)
  difficulty = user_difficulty
  ...
  if not question and not user_difficulty:
      question = get_random_question(exclude_ids=history, category=category, ...)
  ```
- `ac13c69` (2026-07-10)

---

### UX-7 — 안내 메시지가 4번 보기 안에 섞여 표시됨 (`chat/page.tsx`) ✅

**증상:** "모르겠어" 입력 시 문제가 재출력되고 "모르겠다면 일단 1~4번 중 하나를 찍어보세요!" 메시지가 ④번 버튼 내부에 포함되어 표시됨.

**원인:** `parseOptions` line 56의 정규식 `replace(/\n+번호로 답하세요\.\s*$/, "")` 에서 `$`가 문자열 끝을 가리키는데, "번호로 답하세요." 뒤에 note(`> 텍스트`)가 있으면 `$`가 매칭되지 않아 제거 실패. 결과적으로 `cleaned`에 note가 남고, ④의 끝 범위가 `paras.length`라서 "번호로 답하세요." + note 전부가 ④ 버튼 내용에 포함됨.

**수정 내용:**
- `parseOptions`에서 "번호로 답하세요." 이후 텍스트를 `suffix`로 분리해 반환:
  ```typescript
  const suffixMatch = body.match(/\n+번호로 답하세요\.\s*\n+([\s\S]+)$/);
  const suffix = suffixMatch ? suffixMatch[1].trim() : undefined;
  const cleaned = body.replace(/\n+번호로 답하세요\.[\s\S]*$/, "").trim();
  return { stem, options, suffix };
  ```
- 버튼 목록 아래에 `optData.suffix`를 `ReactMarkdown`으로 별도 렌더링
- `mdComponents`에 `blockquote` 커스텀 컴포넌트 추가 → 파란 배경 + 왼쪽 테두리 callout 박스 스타일
- 백엔드 변경 없음 — 기존 `"> 텍스트"` blockquote 형식 그대로 동작
- `af9a314` (2026-07-10)

---

### UI-전체 — stone/amber 디자인 시스템 도입 ✅

**원인:** 모든 버튼 `bg-blue-600`, 배경 `bg-gray-50`, 카드 `rounded-xl` 패턴 반복 → 의도 없이 생성된 느낌(바이브코딩) 지적.

**디자인 방향:** 따뜻한 오프화이트 + 앰버 — stone(중립 warm gray) + amber(강조) 두 축으로 정리.

**수정 범위:**

| 파일 | 주요 변경 |
|------|-----------|
| `layout.tsx` | `bg-gray-50` → `bg-stone-50`, `text-gray-900` → `text-stone-900` |
| `login/page.tsx` | 입력창 `focus:ring-amber-400`, 버튼 `bg-amber-600`, 링크 `text-amber-700` |
| `signup/page.tsx` | 동일 패턴, 체크박스 `accent-amber-600` |
| `onboarding/page.tsx` | 선택 상태 `border-amber-500 bg-amber-50`, 버튼 `bg-amber-600` |
| `Sidebar.tsx` | 예상 점수 카드 `bg-amber-50 border-amber-100`, 진행 바 `bg-amber-500` |
| `chat/page.tsx` | 사용자 버블 `bg-stone-800`, 전송 버튼 `bg-amber-600`, SQL 실행 버튼 `bg-amber-600` |
| `wrong-answers/page.tsx` | 안내 배너 `bg-amber-50 border-amber-100`, 카드 hover `border-amber-300` |

`c894818` (2026-07-12)

---

### UX-딜레이 — 보기 버튼 클릭 딜레이 제거 (`chat.py`, `chat/page.tsx`) ✅

**원인:** Bug 6 수정(commit `f2df0ea`) 이후 `done` 이벤트(= 체크포인트 저장 완료)까지 버튼 비활성화 → PostgresSaver 저장에 수백ms~수초 소요 → 사용자 이탈 유발.

**해결 원리:** `on_chain_end`에서 `pending_question`을 SSE로 즉시 전송. 클라이언트가 캐시해두었다가 답변 요청 시 `client_pending_question`으로 request body에 포함. 백엔드가 체크포인트 대신 request body의 값을 사용해 채점 → checkpoint 경쟁 조건 완전 우회.

**수정 내용:**
```python
# backend/app/api/chat.py
class ChatRequest(BaseModel):
    client_pending_question: dict = {}

# on_chain_end 핸들러에 추가
pq = output.get("pending_question")
if pq and isinstance(pq, dict) and pq.get("id"):
    yield f"data: {json.dumps({'type': 'pending_question', 'content': pq})}\n\n"

# input_data 구성 시
elif client_pending_question and client_pending_question.get("id"):
    input_data["pending_question"] = client_pending_question
```
```typescript
// frontend/app/chat/page.tsx
const [pendingQuestionCache, setPendingQuestionCache] = useState<Record<string, unknown>>({});
const pendingQuestionCacheRef = useRef<Record<string, unknown>>({});

// SSE 핸들러
} else if (event.type === "pending_question") {
  setPendingQuestionCache(event.content);
  pendingQuestionCacheRef.current = event.content;
}

// 버튼 disabled
disabled={(isLoading && !hasPendingQuestion) || isAnswered}
```

`4bec150` (2026-07-12)

---

### UX-로딩점1·2 — 불필요한 `...` 로딩 표시 제거 (`chat/page.tsx`) ✅

**증상 1 (로딩점1):** 답 선택 직후 문제 버블과 사용자 답 버블 사이에 `...` 두 개 표시.

**원인 1:** `message` SSE 핸들러가 메시지마다 빈 슬롯 추가 → `done` 전 버튼 클릭 시 구 슬롯 + 신 슬롯 동시 표시.

**증상 2 (로딩점2):** 오답 해설 후 개념 설명 없을 때 `done` 올 때까지 `...` 잔류.

**원인 2:** 빈 슬롯 숨김 조건이 `!isLoading` 또는 `lastMsgIsQuestion`에만 의존.

**수정 내용:**
```typescript
// 수정 전 (복잡한 조건)
if (msg.content === "" && (isAnswered || (aiHasResponded && (!isLoading || lastMsgIsQuestion)))) return null;

// 수정 후 (단순화)
if (msg.content === "" && (isAnswered || aiHasResponded)) return null;
```
- `isAnswered`: 이미 답한 메시지 뒤 빈 슬롯 즉시 숨김 (로딩점1 해결)
- `aiHasResponded`: AI 응답이 한 번이라도 오면 빈 슬롯 숨김 (로딩점2 해결)
- 다음 메시지가 실제로 오면 해당 슬롯이 자동 교체되어 정상 표시됨

추가로 `streamIdRef` 스트림 버전 관리 추가 — 구 스트림의 `done`이 신 스트림의 `isLoading`·빈 슬롯을 잘못 수정하는 간섭 버그 방지.

`f1ee7c2`, `728f08c` (2026-07-12)
