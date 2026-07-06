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
| 6 | 같은 문제 정답 판정 불일치 | 미조사 | 미확인 | ⏳ 조사 필요 |
| 7 | 로그아웃 후 재로그인 시 풀이 기록 사라짐 | sync 단일 연결 유휴 끊김 → MemorySaver fallback | `checkpointer.py`, `requirements.txt` | ✅ 완료 (2026-07-06) |
| UI-1 | 보기 일부만 코드 박스 (WITH 오감지) | `WITH GRANT OPTION` 등이 SQL 구문으로 오분류됨 | `drill_node.py` | ✅ 완료 (2026-07-06) |
| UI-2 | 보기 번호가 context 번호목록과 혼동 | `1. 2. 3.` 형식이 업무규칙 번호와 동일 | `drill_node.py` | ✅ 완료 (2026-07-06) |

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

## 미해결 버그 (조사 필요)

### Bug 6 — 정답 판정 불일치
- **증상:** 같은 문제를 처음엔 오답, 재시도 시 정답으로 처리
- **다음 단계:** LangSmith 트레이스에서 해당 세션 재현 후 `drill_node.py` 채점 로직 확인

### Bug 7 — 로그아웃 후 기록 소실 (`checkpointer.py`)

**원인:** `psycopg.connect()`로 단일 동기 연결을 서버 시작 시 1개만 생성. Render 등 유휴 연결을 끊는 환경에서 연결이 끊어지면 `MemorySaver` fallback 발생 → 서버 재시작 시 체크포인트 전체 소실.

**수정 내용:**
- `psycopg2-binary` → `psycopg[binary,pool]` (requirements.txt)
- 단일 연결 → `ConnectionPool(min_size=1, max_size=5)` 사용

```python
from psycopg_pool import ConnectionPool
pool = ConnectionPool(db_url, min_size=1, max_size=5, open=True)
saver = PostgresSaver(pool)
```

**사용자 체감:** 재로그인 후 사이드바의 정답률·연속정답·약점 카테고리가 그대로 유지됨.
