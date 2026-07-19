# 버그 수정 로그 (2차 베타 피드백 기준)

**기준:** 2차 베타 피드백 (2026-07-16) → [beta_feedback_round2.md](beta_feedback_round2.md)

---

## 버그 목록 및 상태

| # | 증상 | 원인 | 파일 | 상태 |
|---|------|------|------|------|
| R2-탈퇴 | 회원 탈퇴 시 400 오류 — 탈퇴 불가 | `delete_user()` RPC가 `auth.users` 직접 삭제 불가 (Admin API 권한 필요), `getSession()` httpOnly 쿠키로 null 반환, FK 제약 오류 | `frontend/app/account/delete/route.ts` (신규), `frontend/app/chat/page.tsx`, Supabase SQL | ✅ 완료 (2026-07-18) |
| R2-QA1 (시나리오 1) | 진단 8문제 도중 이탈 후 재접속 시 남은 문항 소실 | `is_diagnostic_in_progress`, `diagnostic_progress` 미제공 → 프론트가 재접속 시 진단 미완료 여부 판단 불가 | `backend/app/api/progress.py`, `frontend/app/chat/page.tsx` | ✅ 완료 (2026-07-18) |
| R2-QA1 (시나리오 2) | 진단 완료 후에도 "진단 문제 줘" 재요청 시 진단 재시작 | `is_diagnostic_done` 플래그 및 차단 로직 없음 | `backend/app/agent/state.py`, `nodes/intent_classifier.py`, `nodes/diagnose_node.py`, `agent/graph.py` | ✅ 완료 (2026-07-18) |
| R2-QA9 | 진단 완료 후 "진단 문제 줘" 입력 시 빈 버블만 표시 | `diagnostic_block_node`가 `NON_LLM_NODES`에 없어 `on_chain_end` 메시지 미전송 | `backend/app/api/chat.py` | ✅ 완료 (2026-07-19) |
| R2-QA2 | 오답 복습 시 진단 중 틀린 문항이 재출제됨 | `state_updater.py`가 `is_diagnostic=True` 구간 오답도 `recent_mistakes`에 추가 | `backend/app/agent/nodes/state_updater.py` | ✅ 완료 (2026-07-17) |
| R2-QA7 | 채점 직후 "오답 복습해줘" 입력 시 분석 텍스트만 나옴 | `follow_up_mode` 블록에서 review/diagnose 탈출 조건 없어 chatbot으로 라우팅 | `backend/app/agent/nodes/intent_classifier.py` | ✅ 완료 (2026-07-17) |
| R2-QA10 | 오답 복습 선택지 버튼 미표시 | `review_node._format_question`이 `[카테고리 / 난이도: X]` + ①②③④ 형식을 사용하지 않음 | `backend/app/agent/nodes/review_node.py` | ✅ 완료 (round1 UX-1과 함께) |
| R2-QA10b | 오답 복습 중 비숫자 입력 시 안내 없이 문제만 재출력 | 안내 메시지 누락 | `backend/app/agent/nodes/review_node.py` | ✅ 완료 (2026-07-17) |
| R2-QA16a | 보기 텍스트 중 `0~1 사이` 등 범위 표현에 취소선 오표시 | remark-gfm 기본값 `singleTilde: true` → `~text~` 패턴 취소선 처리 | `frontend/app/chat/page.tsx` | ✅ 완료 (2026-07-19) |
| R2-QA16b | 개념 설명에 볼드 기준 없음 — 일반 단어에 볼드 남발, 이탤릭 무분별 사용, `**단어를**` 파싱 실패로 별표 노출 | LLM 프롬프트에 볼드/이탤릭 사용 기준 없음, ReactMarkdown에 `em` 커스텀 렌더러 없음 | `backend/app/agent/tools/explain_tools.py`, `frontend/app/chat/page.tsx` | ✅ 완료 (2026-07-19) |
| R2-자동개념설명 | 오답 후 자동 개념 설명이 트리거되지 않음 | `client_pending_question` race condition — drill_node 출제 체크포인트 저장 전 채점 요청 도착 시 `last_category`가 직전 진단 문제 카테고리로 남음 | `backend/app/agent/nodes/state_updater.py` | ✅ 완료 (2026-07-19) |
| R2-QA4 | 채점 후 다음 문제로 가려면 매번 "문제 줘" 직접 타이핑해야 함 | 채점·개념설명 버블 하단에 "다음 문제 →" 버튼 미존재 | `frontend/app/chat/page.tsx` | ✅ 완료 (2026-07-19) |
| R2-로딩버블a | 일반 모드 채점 후 ...버블 미표시 | `loading` 이벤트를 진단 모드에서만 발송 — 일반 오답 후 개념 설명 대기 중 빈 슬롯 없음 | `backend/app/api/chat.py` | ✅ 완료 (2026-07-19) |
| R2-로딩버블b | 채점 직후 ...버블이 여전히 미표시 | React 18 자동 배칭 — `loading` 이벤트가 `message` 이벤트와 같은 tick에 처리되어 `setMessages`가 이전 state 참조 → 빈 슬롯 추가 안 됨. `message` 핸들러 내에서 동일 setState로 빈 슬롯 함께 추가해 해결 | `frontend/app/chat/page.tsx` | ✅ 완료 (2026-07-19) |

---

## 수정 상세

### R2-탈퇴 — 회원 탈퇴 400 오류 3단계 수정

**원인 A:** `auth.users` 삭제는 Admin API (service_role key) 필요. `SECURITY DEFINER` SQL 함수로는 불가.

**원인 B:** `@supabase/ssr`은 세션을 httpOnly 쿠키에 저장 → 브라우저 JS의 `getSession()`이 null 반환 → 기존 FastAPI `/api/user` 엔드포인트에 토큰 전달 불가.

**원인 C:** `public.users`가 `auth.users(id)`를 FK 참조 → `auth.users` 먼저 삭제 시 FK 제약 위반 (오류코드 23503).

**수정 내용:**
1. Next.js Server Route `app/account/delete/route.ts` 신규 생성 — `createServerClient`로 httpOnly 쿠키 읽기, 사용자 JWT로 `delete_user()` RPC 호출 후 service_role key로 Admin API 삭제
2. Supabase SQL `delete_user()` 함수에 `DELETE FROM public.users WHERE id = uid;` 추가 (FK 먼저 제거)
3. `chat/page.tsx`의 `handleDeleteAccount`를 `/account/delete` DELETE 요청으로 변경

---

### R2-QA1 시나리오 1 — 재접속 시 진단 미완료 배너

**수정 내용:**
- `progress.py`: `is_diagnostic_in_progress` (bool), `diagnostic_progress` (int) 필드 추가
  - `is_diagnostic=True` & `is_diagnostic_done=False`일 때 in_progress 반환
  - `diagnostic_progress = total_answered - diagnostic_start_count`
- `chat/page.tsx`:
  - `diagnosticResume` state 추가
  - 세션 준비 후 progress API 호출 → `is_diagnostic_in_progress=true`이면 amber 배너 표시
  - "이전 진단을 **N/8** 문제까지 풀었어요. 이어서 마저 풀까요?" + "이어서 풀기" / "닫기" 버튼
  - "이어서 풀기" 클릭 시 "진단 이어서 해줘" 자동 전송

`cde489c` (2026-07-18)

---

### R2-QA1 시나리오 2 — 진단 완료 후 재시작 차단

**수정 내용:**
- `state.py`: `is_diagnostic_done: bool` 필드 추가
- `diagnose_node.py`: 초기 진단 완료 시 `{"is_diagnostic_done": True}` 반환
- `intent_classifier.py`: `_DIAGNOSTIC_START` 패턴 감지 시 `is_diagnostic_done=True`이면 `diagnostic_block` 모드 반환
- `graph.py`: `diagnostic_block_node` 추가 ("초기 진단은 이미 완료했어요. 약점이 궁금하면 '약점 분석해줘'라고 해보세요."), `END`로 연결

`cde489c` (2026-07-18)

---

### R2-QA9 — diagnostic_block 빈 버블

**원인:** `diagnostic_block_node`는 LLM 없이 `AIMessage`를 직접 반환하는데, `NON_LLM_NODES`에 포함되지 않아 `on_chain_end` 이벤트에서 메시지 미전송 → 로딩 버블만 나타났다 사라짐.

**수정 내용:**
```python
NON_LLM_NODES = {"drill", "review", "diagnose", "sql", "state_updater", "explain", "diagnostic_block"}
```

`d2c341d` (2026-07-19)

---

### R2-QA16 — 보기 취소선 오표시

**원인:** remark-gfm v4 기본값 `singleTilde: true` → `~text~` (틸드 하나)도 취소선 처리. "0~1 사이", "0~100 사이" 같은 범위 표현이 취소선으로 렌더링.

**수정 내용:**
```tsx
// 수정 전
remarkPlugins={[remarkGfm]}
// 수정 후 (전체 ReactMarkdown 컴포넌트 동일 적용)
remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
```
`~~text~~` (틸드 두 개)만 취소선으로 처리.

`d2c341d` (2026-07-19)

---

### R2-QA2 — 오답 복습 시 진단 문항 재출제

**원인:** `state_updater.py`가 진단 중(`is_diagnostic=True`) 틀린 문항도 `recent_mistakes`에 추가 → 이후 오답 복습 요청 시 진단 문항이 섞여 재출제.

**수정 내용:**
```python
# 수정 전
if not correct and qid not in mistakes:
    mistakes.append(qid)
# 수정 후
if not correct and qid not in mistakes and not state.get("is_diagnostic", False):
    mistakes.append(qid)
```

`007427b` (2026-07-17)

---

### R2-QA7 — 채점 직후 오답 복습 요청 시 분석 텍스트만 출력

**원인:** 채점 후 `follow_up_mode=True` 상태에서 "오답 복습해줘" 입력 시 `intent_classifier`가 chatbot으로 라우팅 → 텍스트 분석만 생성, 문제 재출제 없음.

**수정 내용:**
```python
# follow_up_mode 블록에 review/diagnose 탈출 조건 추가
if _REVIEW.search(text):
    return {"current_mode": "review", "follow_up_mode": False}
if _DIAGNOSE.search(text):
    return {"current_mode": "diagnose", "follow_up_mode": False}
```

`007427b` (2026-07-17)

---

### R2-QA10 — 오답 복습 선택지 버튼 미표시

**원인:** `review_node._format_question`이 이미 `[카테고리 / 난이도: X]` 헤더 + ①②③④ 형식을 사용하고 있어, round1 UX-1(버튼 렌더링 구현) 시점에 함께 해결됨.

**추가 수정 (2026-07-17):** 비숫자 입력 시 안내 메시지 누락 보완
```python
note = "\n\n> 1~4번 중 하나를 선택해주세요."
return {"messages": [AIMessage(content=_format_question(pending) + note)]}
```

`d58fd32` (2026-07-17)

---

### R2-자동개념설명 — 오답 후 자동 개념 설명 미트리거

**원인:** `client_pending_question` race condition. drill_node 출제 완료 후 SSE를 통해 `pending_question`이 프론트에 전달되지만, LangGraph 체크포인트 저장은 비동기로 진행됨. 사용자가 빠르게 답변하면 체크포인트 저장 완료 전에 채점 요청이 도착해 LangGraph가 이전 체크포인트(진단 마지막 문제 `last_category`='관리 구문')를 로드. `pending_question`은 `client_pending_question`으로 보완되지만 `last_category`는 잘못된 값으로 남아 `adaptive_difficulty_router`가 틀린 카테고리(관리 구문, 시도 1회, 정답률 1.00)를 체크해 explain 조건을 충족하지 못함.

**수정 내용:**
```python
# state_updater return dict에 last_category 추가
"last_category": category,  # 채점된 문제의 카테고리로 항상 업데이트
```

state_updater 실행 시 채점된 문제의 category로 `last_category`를 업데이트하면, router 실행 시점에 체크포인트 race condition과 무관하게 올바른 카테고리를 참조.

`2f49eac` (2026-07-19)
