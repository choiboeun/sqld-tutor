# 동적 시스템 프롬프트 설계 결정서 — 8주차

**작성일:** 2026-06-05  
**주제:** State 기반 동적 시스템 프롬프트 — 학생 약점이 매 턴 LLM에 전달

---

## 개요

7주차까지 `chatbot_node`의 시스템 프롬프트는 고정 문자열이었다.  
LLM은 학생이 어디가 약한지, 연속 정답을 몇 개 했는지 전혀 모르는 상태로 응답했다.

8주차에서 State를 읽어 매 턴 동적으로 프롬프트를 생성하는 `build_system_prompt(state)` 함수를 도입한다.

---

## 변경 전후 비교

**변경 전 (고정 문자열)**
```python
_SYSTEM = """당신은 SQLD 자격증 시험을 도와주는 AI 튜터입니다.
필요에 따라 다음 도구를 사용할 수 있습니다: ..."""
```

**변경 후 (동적 빌드)**
```python
def chatbot_node(state: TutorState) -> dict:
    system = SystemMessage(content=build_system_prompt(state))
    messages = [system] + list(state["messages"])
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}
```

---

## build_system_prompt 구조

**위치:** `backend/app/agent/prompts.py`

### 주입되는 정보

| 필드 | 설명 | 활용 |
|------|------|------|
| `student_level` | beginner / intermediate / advanced | 설명 난이도 조절 |
| `streak` | 연속 정답 수 | 격려 또는 난이도 상향 유도 |
| `total_answered` | 누적 풀이 수 | 학습 현황 파악 |
| `accuracy_by_category` | 카테고리별 정답률 | 취약 카테고리 식별 |
| `attempts_by_category` | 카테고리별 시도 횟수 | 데이터 유효성 판단 (2회 이상만 취약으로 판단) |

### 취약/강점 카테고리 기준

- **취약:** 2회 이상 시도 AND 정답률 < 50%
- **강점:** 2회 이상 시도 AND 정답률 ≥ 80%

### 출력 예시

```
당신은 SQLD 자격증 합격을 돕는 AI 튜터입니다.
학생 수준: 초급 | 누적 풀이: 7문제 | 현재 연속 정답: 1개
취약 카테고리 (정답률 50% 미만): 조인, 서브쿼리 & Top N
→ 취약 카테고리 관련 질문에는 더 자세히, 쉽게 설명하세요.
강점 카테고리 (정답률 80% 이상): 데이터 모델링 기초
필요에 따라 다음 도구를 사용할 수 있습니다: ...
```

---

## 설계 결정 이유

1. **매 턴 주입:** LangGraph는 매 호출마다 노드를 새로 실행한다. 프롬프트를 캐싱하지 않고 매번 최신 State에서 빌드하면 최신 약점 정보가 자동 반영된다.
2. **2회 이상 조건:** 1회 시도만으로는 단순 실수인지 취약인지 판단하기 어렵다. 2회 이상 시도한 카테고리만 취약/강점으로 분류한다.
3. **chatbot_node에만 적용:** `drill_node`, `review_node`, `diagnose_node`는 LLM을 직접 호출하지 않는다. `explain_node`는 RAG 프롬프트를 별도로 관리하므로 chatbot_node에만 적용했다.
