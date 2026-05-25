# Walking Skeleton 구현 보고서 — 4주차

**작성일:** 2026-05-25  
**목표:** LangGraph 기반 최소 작동 AI 튜터 구현

---

## 개요

Walking Skeleton은 전체 시스템의 뼈대를 최소한으로 구현한 것이다.  
문제 출제 → 답변 → 채점의 핵심 흐름이 실제로 동작하는 상태를 의미한다.  
이 단계에서는 기능의 완성도보다 **전체 흐름이 연결되는 것**을 목표로 한다.

---

## 구현 파일 목록

| 파일 | 역할 |
|------|------|
| `backend/app/agent/state.py` | LangGraph State 정의 |
| `backend/app/agent/nodes/chatbot.py` | chatbot 노드 (LLM 호출) |
| `backend/app/agent/tools/question_tools.py` | 문제 출제 도구 |
| `backend/app/agent/graph.py` | 그래프 조립 |
| `backend/app/main_cli.py` | CLI 테스트 인터페이스 |

---

## 1. State 설계 (`state.py`)

```python
class TutorState(TypedDict):
    messages: Annotated[list, add_messages]  # 대화 이력 (자동 누적)
    current_mode: str        # "drill" | "explain" | "diagnose"
    pending_question: dict   # 현재 출제된 문제 (채점 전 상태)
```

**설계 근거:**
- `messages`: LangGraph의 `add_messages` reducer로 대화 이력 자동 누적
- `current_mode`: 향후 모드 전환 기능 확장을 위한 필드 (현재는 "drill" 고정)
- `pending_question`: 출제된 문제를 State에 보관해 채점 시 참조 (현재는 LLM이 메시지 이력으로 처리)

---

## 2. 문제 출제 도구 (`question_tools.py`)

```python
@tool
def generate_sqld_question() -> dict:
    """SQLD 문제를 랜덤으로 1개 반환한다."""
```

**동작 방식:**
1. `questions_v0.1.jsonl`에서 전체 110문제 로드
2. `random.choice()`로 1문제 랜덤 선택
3. LLM에게 필요한 필드만 추출해서 반환

**도구 반환 필드:**

| 필드 | 설명 |
|------|------|
| `id` | 문제 고유 ID (q001 ~ q110) |
| `category` | 카테고리 (11개 중 하나) |
| `difficulty` | 난이도 (상/중/하) |
| `context` | SQL, ERD 등 문제에 필요한 자료 (없으면 None) |
| `question` | 문제 본문 |
| `options` | 선택지 4개 |
| `answer` | 정답 번호 |

**JSONL 전체 스키마와의 관계:**  
JSONL에는 `hint`, `explanation`, `tags` 등 추가 필드가 있으나, 현재 단계(문제 출제·채점)에는 불필요하므로 제외.  
해설 기능 구현 시(6주차 예정) `explanation` 필드를 도구에 추가할 예정.

---

## 3. chatbot 노드 (`chatbot.py`)

**LLM:** `gemini-2.5-flash` (Google Gemini)

```python
SYSTEM_PROMPT = """당신은 SQLD 자격증 시험을 도와주는 AI 튜터입니다.
사용자가 '문제 줘', '문제 내줘' 등을 요청하면 generate_sqld_question 도구를 호출해 문제를 출제하세요.
문제를 출제할 때는 선택지를 번호와 함께 보기 좋게 보여주세요.
사용자가 번호로 답을 말하면 pending_question의 정답과 비교해서 채점해주세요.
한국어로 친절하게 답변하세요."""
```

**동작 방식:**
1. SystemMessage + 대화 이력을 LLM에 전달
2. LLM이 도구 호출이 필요하면 `tool_calls` 포함한 AIMessage 반환
3. LLM이 도구 호출이 불필요하면 일반 텍스트 응답 반환

---

## 4. 그래프 구조 (`graph.py`)

```
START
  │
  ▼
chatbot ──── tool_calls 있음 ──▶ tools
  │                                │
  │◀───────────────────────────────┘
  │
  ▼ (tool_calls 없음)
 END
```

**구성 요소:**

| 구성 요소 | 내용 |
|-----------|------|
| StateGraph | TutorState 기반 그래프 |
| chatbot 노드 | Gemini Flash LLM 호출 |
| tools 노드 | ToolNode (generate_sqld_question 실행) |
| 조건 엣지 | tool_calls 유무로 tools vs END 분기 |
| MemorySaver | thread_id 기반 대화 이력 영속화 |

**MemorySaver 동작 확인:**  
같은 `thread_id`로 CLI 재실행 시 이전 대화 이력이 유지되는 것을 직접 테스트로 확인.

---

## 5. CLI 테스트 결과

**실행 명령:**
```bash
cd backend && .venv/bin/python3 -m app.main_cli
```

**테스트 시나리오:**

| 입력 | 결과 |
|------|------|
| "문제 줘" | generate_sqld_question 도구 호출 → 문제 + 선택지 출력 |
| "2" (선택지 번호) | 정답 여부 채점 + 간단한 설명 |
| 재실행 후 "문제 줘" | 이전 대화 이력 유지된 상태에서 새 문제 출제 |

**발견 및 수정한 버그:**

| 버그 | 원인 | 수정 |
|------|------|------|
| AI 응답이 빈 문자열로 출력 | `get_text()`가 Gemini list 형식 응답을 처리 못함 | list 순회 시 `type == "text"` 항목만 추출하도록 수정 |
| "위 SQL"이 문맥 없이 출력 | `generate_sqld_question`에서 `context` 필드 누락 | `context` 필드 추가 |

---

## 6. LangSmith 관측성 확인

- 프로젝트: `sqld-tutor`
- Thread ID `test-session-1` — 9 turns 정상 기록
- 각 turn에서 확인된 내용:
  - HUMAN 입력 기록
  - AI의 `generate_sqld_question` 도구 호출 기록
  - TOOL 실행 결과 (문제 데이터) 기록
  - 최종 AI 응답 기록

---

## 7. 환경 설정 요약

| 설정 | 값 |
|------|-----|
| Python 가상환경 | `backend/.venv` |
| LLM | Google Gemini 2.5 Flash |
| LangSmith 프로젝트 | sqld-tutor |
| 체크포인터 | MemorySaver (인메모리, 개발용) |
| 향후 전환 예정 | PostgresSaver (Supabase 연결, 5~8주차) |

---

## 8. 다음 단계 (5주차 예정)

- FastAPI 서버 구축 및 그래프 연결
- 프론트엔드(Next.js)와 API 연결
- 문제 출제 → 채점 → 결과 Supabase 저장 흐름 완성
- MemorySaver → PostgresSaver 전환 검토
