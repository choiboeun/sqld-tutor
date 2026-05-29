# 다중 노드 + 그래프 설계 결정서

**작성일:** 2026-05-30  
**변경 요약:** Walking Skeleton (chatbot 단일 노드) → 7개 노드 + 조건부 라우팅

---

## 그래프 구조 변경

### v0.1 (4주차 Walking Skeleton)
```
START → chatbot → (tool_call?) → tools → chatbot → END
```
- chatbot 노드 하나가 의도 파악 + 문제 출제 + 채점 + 일반 대화 전부 처리
- ToolNode로 generate_sqld_question 호출

### v0.2 (5주차)
```
START → intent_classifier → route_by_intent
    ├→ "drill"    → drill_node   → after_drill → state_updater → END
    │                                         └→ END (출제만)
    ├→ "review"   → review_node  → after_drill → state_updater → END
    │                                         └→ END (출제만)
    ├→ "explain"  → explain_node  → END
    ├→ "diagnose" → diagnose_node → END
    └→ "chat"     → chatbot_node  → END
```

---

## 노드별 설계

### `intent_classifier`
- **역할**: 사용자 입력을 읽어 `current_mode` 결정
- **방식**: 키워드 기반 규칙 매칭 (LLM 호출 없음 — 비용/속도 고려)
- **입력**: `state["messages"][-1]` (마지막 사용자 메시지), `state["pending_question"]`
- **출력**: `{"current_mode": "drill"|"review"|"explain"|"diagnose"|"chat"}`
- **핵심 규칙**: `pending_question`이 있고 "1"~"4번" 입력 → 현재 모드 유지 (drill이면 drill, review면 review)

| 패턴 | 분류 |
|------|------|
| "문제", "다음", "풀어", "시작" | drill |
| "오답", "복습", "틀린 문제" | review |
| "설명", "뭐야", "개념", "알려" | explain |
| "약점", "분석", "취약", "통계" | diagnose |
| 그 외 | chat |

### `route_by_intent`
- **역할**: `current_mode` 값을 그대로 반환 → LangGraph 조건부 엣지의 분기 키로 사용
- **구현**: `return state.get("current_mode", "chat")`
- **결정 이유**: intent_classifier가 State를 갱신한 후 바로 라우팅. 별도 로직 없이 State 값만 읽으면 충분.

### `drill_node`
- **역할**: `pending_question` 유무로 분기
  - 비어있음 → 새 문제 출제 (`get_random_question(exclude_ids=question_history)`)
  - 있음 → 사용자 답변 채점 후 피드백
- **입력**: `pending_question`, `question_history`, 마지막 사용자 메시지
- **출력 (출제 시)**: `pending_question` 설정, `last_category` 갱신, `retry_count = 0`
- **출력 (채점 시)**: `pending_question = {}`, `question_history` 추가, `last_grade_result` 설정

### `review_node`
- **역할**: `recent_mistakes`에서 랜덤 출제 후 채점
- **drill_node와 차이**: 출제 소스가 `question_history`(랜덤 전체)가 아닌 `recent_mistakes`(오답만)
- **추가 동작**: 정답 시 `recent_mistakes`에서 해당 id 제거
- **결정 이유**: drill_node에 합치면 출제 소스 분기가 복잡해져 별도 노드로 분리

### `explain_node`
- **역할**: SQLD 개념 설명 (LLM 호출)
- **컨텍스트 활용**: `last_grade_result`에 방금 틀린 문제가 있으면 해당 카테고리를 힌트로 시스템 메시지에 추가
- **LLM**: Gemini 2.5 Flash (llm.py 공유 인스턴스)
- **향후**: Phase 1-A(9주차)에서 RAG 연동 예정

### `diagnose_node`
- **역할**: `accuracy_by_category` + `attempts_by_category` 기반 약점 분석 리포트 생성
- **LLM 미사용**: 순수 계산 + 포매팅 (LLM 불필요, 속도·비용 절약)
- **출력**: 카테고리별 정답률 막대그래프, 취약 카테고리 Top 3 (60% 미만)
- **가드**: 풀이 데이터 없으면 "먼저 문제를 풀어보세요" 안내

### `state_updater`
- **역할**: 채점 직후 성과 지표 일괄 갱신
- **트리거**: `last_grade_result`가 None이 아닐 때만 실행
- **갱신 항목**:
  - `accuracy_by_category`: `round(old_accuracy × old_attempts)` 역산 후 재계산
  - `attempts_by_category`: +1
  - `streak` / `consecutive_wrong`: 정오답에 따라 갱신 및 리셋
  - `recent_mistakes`: 오답 시 추가 (review_node 정답 시 제거는 review_node에서 이미 처리)
  - `total_answered`, `session_question_count`: +1
  - `last_grade_result`: None으로 초기화
- **결정 이유**: 채점 결과 처리를 drill/review 노드에서 직접 하면 두 노드에 중복 로직 발생. state_updater 한 곳에서 처리.

### `chatbot_node`
- **역할**: 일반 대화 fallback (기존 4주차에서 유지)
- **변경**: llm.py 공유 모듈로 LLM 임포트 방식 변경

---

## 엣지 설계

### 일반 엣지
```python
builder.add_edge(START, "intent_classifier")
builder.add_edge("state_updater", END)
builder.add_edge("explain", END)
builder.add_edge("diagnose", END)
builder.add_edge("chatbot", END)
```

### 조건부 엣지 1: `route_by_intent`
```python
builder.add_conditional_edges(
    "intent_classifier", route_by_intent,
    {"drill": "drill", "review": "review", "explain": "explain",
     "diagnose": "diagnose", "chat": "chatbot"}
)
```

### 조건부 엣지 2: `after_drill`
```python
def after_drill(state) -> str:
    if state.get("last_grade_result"):  # 채점이 일어났으면
        return "state_updater"
    return END  # 문제 출제만 했으면 바로 종료

builder.add_conditional_edges("drill", after_drill, {"state_updater": "state_updater", END: END})
builder.add_conditional_edges("review", after_drill, {"state_updater": "state_updater", END: END})
```
- `after_drill`을 drill/review 두 노드에 공유해 중복 제거

---

## 공통 모듈 분리

### `llm.py` 신규 생성
- **이유**: 4주차에서는 chatbot.py 안에 LLM 인스턴스 생성 + load_dotenv가 함께 있었음. 5주차에서 explain_node도 LLM이 필요해지면서 중복 방지를 위해 공유 모듈로 분리.

### `question_tools.py` 변경
| 변경 | 내용 |
|------|------|
| `get_random_question(exclude_ids)` 추가 | question_history 기반 중복 방지 |
| `get_question_by_id(id)` 추가 | review_node에서 특정 문제 조회 |
| `explanation` 필드 추가 | 채점 피드백에 해설 표시 |
| `generate_sqld_question` (tool) | chatbot_node 하위 호환용으로 유지 |
