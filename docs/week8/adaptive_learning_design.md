# 적응형 학습 로직 설계 결정서 — 8주차

**작성일:** 2026-06-05  
**주제:** adaptive_difficulty_router 설계 및 카테고리 전환 로직

---

## 개요

8주차 핵심 목표는 학생의 학습 성과(streak, 정답률)에 따라 다음 학습 방향을 자동으로 결정하는 적응형 라우팅 로직을 구현하는 것이다.

---

## adaptive_difficulty_router

### 위치

`backend/app/agent/graph.py` — `state_updater` 이후 조건부 엣지

### 두 가지 조건

| 조건 | 동작 | 근거 |
|------|------|------|
| `정답률 < 20%` AND `시도 ≥ 1` AND `해당 카테고리 미설명` | `explain` 노드로 강제 유도 | 틀린 즉시 개념 보완 |
| 그 외 | `END` | 학생 자율 진행 |

### streak ≥ 3 처리

라우팅 경로를 바꾸는 게 아니라 `state_updater`에서 `suggest_category_switch = True` 신호를 세팅한다.  
이후 `drill_node`가 다음 문제를 출제할 때 이 신호를 읽어 `last_category`를 회피한다.

```python
# graph.py
def adaptive_difficulty_router(state: TutorState) -> str:
    last_category = state.get("last_category")
    accuracy = state.get("accuracy_by_category") or {}
    attempts = state.get("attempts_by_category") or {}

    if last_category:
        cat_attempts = attempts.get(last_category, 0)
        cat_accuracy = accuracy.get(last_category, 0.0)
        already_explained = state.get("last_explained_category") == last_category
        if cat_attempts >= 1 and cat_accuracy < 0.2 and not already_explained:
            return "explain"

    return END
```

### 그래프 엣지 변경

```
# 변경 전
state_updater → END

# 변경 후
state_updater → [adaptive_difficulty_router] → explain | END
```

---

## explain 반복 방지 — last_explained_category

### 문제

같은 카테고리 문제를 연속으로 틀리면 매번 동일한 개념 설명이 반복 출력된다.

### 해결

`last_explained_category: Optional[str]` 필드를 State에 추가한다.

| 시점 | 동작 |
|------|------|
| 적응형 explain 실행 시 | `last_explained_category = last_category` 설정 |
| 해당 카테고리 정답 시 | `last_explained_category = None` 리셋 |
| `adaptive_difficulty_router` | `last_explained_category == last_category`이면 explain 건너뜀 |

### 결과

```
조인 첫 오답  → 채점 + 조인 개념 설명  (explain 실행)
조인 두 번째 오답 → 채점만             (반복 방지)
조인 정답     → 채점만, 플래그 리셋
조인 세 번째 오답 → 채점 + 개념 설명  (리셋 후 재실행)
```

---

## suggest_category_switch — 카테고리 전환

### 흐름

1. `state_updater`: streak ≥ 3 달성 시 `suggest_category_switch = True`, 전환 메시지 추가
2. `drill_node`: 새 문제 출제 시 `suggest_category_switch == True`이면 `avoid_category = last_category` 전달
3. `get_random_question`: `avoid_category` 제외 후 랜덤 선택 (대안 없으면 무시)
4. 문제 출제 후 `suggest_category_switch = False` 리셋

### 검증 결과

```
조인 정답 3연속 → streak=3, suggest_category_switch=True
"문제 줘" → 조인 제외 다른 카테고리 문제 출제 (SELECT & WHERE 등)
suggest_category_switch → False (리셋)
```

---

## 9주차 개선 예정

RAG 개념 설명이 현재 `last_category`(카테고리명 전체)로 검색되어 개괄적 설명이 나온다.  
문제의 `tags` 필드(예: `["self_join"]`, `["row_number"]`)를 활용해 더 정확한 개념을 설명하도록 개선 예정.  
→ 11개 카테고리 전체에 해당하는 문제. `docs/CLAUDE.md` Phase 1-A 개선 과제 참조.
