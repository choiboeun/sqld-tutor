# 버그 수정 로그 (14주차)

**기준:** 1차 베타 피드백 (2026-07-03) → [beta_feedback_round1.md](../week13/beta_feedback_round1.md)

---

## 버그 목록 및 상태

| # | 증상 | 원인 | 파일 | 상태 |
|---|------|------|------|------|
| 1 | "문제주지마" 입력 시 문제 출제됨 | `_DRILL` 정규식이 부정 표현을 구분하지 못함 | `intent_classifier.py` | ✅ 완료 (2026-07-05) |
| 2 | 카테고리 전환 안내 후 문제가 자동으로 나오지 않음 | `adaptive_difficulty_router`가 `suggest_category_switch` 상태를 확인하지 않음 | `graph.py` | ✅ 완료 (2026-07-05) |
| 3 | "모르겠다" 입력 시 설명 중 갑자기 문제로 전환 | chatbot에 generate_sqld_question 도구가 바인딩되어 설명 후 자체 문제 출제 + 진단/일반 모드 미분기 | `drill_node.py` | ✅ 완료 (2026-07-05) |
| 4 | "2 2 3 4" 등 다중 번호 입력 시 정답 처리 | `_ANSWER` 정규식이 첫 번째 숫자만 추출 | `drill_node.py` | ✅ 완료 (2026-07-05) |
| 5 | 메시지 전송 후 입력창 포커스 해제 | `sendMessage` 이후 포커스 복원 코드 없음 | `chat/page.tsx` | ✅ 완료 (2026-07-05) |
| 6 | 같은 문제 정답 판정 불일치 | 미조사 | 미확인 | ⏳ 조사 필요 |
| 7 | 로그아웃 후 재로그인 시 풀이 기록 사라짐 | 미조사 | 미확인 | ⏳ 조사 필요 |

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

### Bug 3 — "모르겠다" 입력 시 진단/일반 모드 분기 처리 (`drill_node.py`)

**원인:** `pending_question`이 있을 때 "모르겠어" 입력 시 chatbot 노드로 라우팅 → chatbot이 `generate_sqld_question` 도구로 설명 중 자체 문제 출제 + 진단/일반 모드 구분 없이 동일 처리

**수정 내용:**
- `_GIVE_UP` 패턴 추가: `모르겠|몰라|포기|모름`
- `drill_node` 내에서 포기 표현 감지 후 `is_diagnostic` 여부로 분기:
  - **진단 중:** "정확하지 않아도 괜찮으니 1~4번 중 골라보세요" 유도 메시지 + 같은 문제 재출력
  - **일반 학습 중:** `explain_concept` 직접 호출 → 개념 설명 → "다시 문제 풀어봐요!" + 같은 문제 재출력

---

## 미해결 버그 (조사 필요)

### Bug 6 — 정답 판정 불일치
- **증상:** 같은 문제를 처음엔 오답, 재시도 시 정답으로 처리
- **다음 단계:** LangSmith 트레이스에서 해당 세션 재현 후 `drill_node.py` 채점 로직 확인

### Bug 7 — 로그아웃 후 기록 소실
- **증상:** 재로그인 시 풀이 기록이 사라짐
- **다음 단계:** PostgresSaver 체크포인트 조회 로직 및 `thread_id` 연속성 확인
