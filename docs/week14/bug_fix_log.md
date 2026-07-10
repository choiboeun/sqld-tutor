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
