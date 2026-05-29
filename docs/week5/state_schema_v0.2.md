# State 스키마 v0.2 — 설계 결정서

**작성일:** 2026-05-30  
**변경 요약:** v0.1 (3개 필드) → v0.2 (17개 필드)

---

## 변경 배경

4주차 Walking Skeleton의 State는 기능 증명 목적으로 최소 구성(3개)이었음.  
5주차에서 다중 노드 라우팅을 구현하면서, 각 노드가 서로 다른 정보를 읽고 써야 하므로 State를 확장.

---

## v0.1 → v0.2 변경 내역

| 필드 | v0.1 | v0.2 | 변경 이유 |
|------|------|------|-----------|
| `messages` | ✅ | ✅ | 유지 |
| `current_mode` | ✅ `"drill"\|"explain"\|"diagnose"` | ✅ `"drill"\|"review"\|"explain"\|"diagnose"\|"chat"` | `review` 모드 추가 (오답 복습 Phase 0-B 핵심 기능) |
| `pending_question` | ✅ | ✅ | 유지 |
| `student_level` | ❌ | ✅ | 추가 — 노드별 프롬프트 난이도 조절에 필요 |
| `target_score` | ❌ | ✅ | 추가 — SQLD 합격선(60점) 기준 진단 리포트에 활용 |
| `difficulty_preference` | ❌ | ✅ | 추가 — 향후 난이도 필터 출제 기능 대비 (현재 "mix" 기본값) |
| `accuracy_by_category` | ❌ | ✅ | 추가 — 11개 카테고리별 정답률, 페인포인트 1번(취약점 파악) 해결 핵심 |
| `attempts_by_category` | ❌ | ✅ | 추가 — accuracy 갱신 시 이전 시도 횟수 없으면 정확한 평균 계산 불가 |
| `recent_mistakes` | ❌ | ✅ | 추가 — 오답 문제 id 목록, 페인포인트 3번(오답 복습 비효율) 해결 핵심 |
| `total_answered` | ❌ | ✅ | 추가 — 누적 총 풀이 수, 학습 진행률 표시 |
| `session_question_count` | ❌ | ✅ | 추가 — 세션 내 풀이 수 (향후 사이드바 통계용) |
| `streak` | ❌ | ✅ | 추가 — 연속 정답 수, 향후 난이도/카테고리 자동 전환 트리거 |
| `consecutive_wrong` | ❌ | ✅ | 추가 — 연속 오답 수, 향후 explain 자동 전환 트리거 |
| `retry_count` | ❌ | ✅ | 추가 — 현재 문제 재시도 횟수, 향후 개념 설명 자동 전환 기준 |
| `question_history` | ❌ | ✅ | 추가 — 출제된 문제 id 목록, 중복 출제 방지 필수 |
| `last_category` | ❌ | ✅ | 추가 — 직전 출제 카테고리, 향후 연속 동일 카테고리 출제 방지 |
| `last_grade_result` | ❌ | ✅ | 추가 — drill/review_node → state_updater 채점 결과 전달용 임시 필드 (사용 후 None 초기화) |

---

## 필드별 상세 설명

### 대화
- **`messages`**: LangGraph `add_messages` reducer 관리. 대화 내역 전체.

### 모드 제어
- **`current_mode`**: intent_classifier가 매 턴 갱신. 라우팅 결정의 유일한 기준.

### 문제 관리
- **`pending_question`**: 출제된 문제가 채점 전까지 저장됨. 채점 완료 시 `{}` 초기화.
- **`question_history`**: 출제된 문제 id의 누적 목록. `get_random_question(exclude_ids=question_history)` 호출 시 중복 방지에 사용.
- **`last_category`**: drill_node가 새 문제 출제 시 갱신. 향후 카테고리 균형 출제 로직에 활용 예정.

### 학생 프로필
- **`student_level`**: "beginner" / "intermediate" / "advanced". 현재 기본값 "beginner", 향후 진단 결과로 자동 갱신 예정.
- **`target_score`**: 기본값 60 (SQLD 합격선). 향후 사용자 설정값으로 변경 가능.
- **`difficulty_preference`**: "low" / "mid" / "high" / "mix". 기본값 "mix". 향후 출제 시 난이도 필터로 사용 예정.

### 성과 추적
- **`accuracy_by_category`**: `{카테고리명: 정답률(0.0~1.0)}`. state_updater가 채점마다 `attempts_by_category`를 기반으로 재계산.
- **`attempts_by_category`**: `{카테고리명: 시도횟수}`. accuracy 역산 계산에 필수. `accuracy_by_category`만으로는 정확한 누적 평균 갱신 불가.
- **`recent_mistakes`**: 오답 문제 id 리스트. drill_node 오답 시 추가, review_node 정답 시 제거.
- **`total_answered`**: state_updater가 채점마다 +1.
- **`session_question_count`**: state_updater가 채점마다 +1. MemorySaver 기준 세션 = 프로세스 실행 단위.

### 연속 기록
- **`streak`**: 정답 시 +1, 오답 시 0 리셋.
- **`consecutive_wrong`**: 오답 시 +1, 정답 시 0 리셋.
- **`retry_count`**: 현재 문제 재시도 횟수. 새 문제 출제 시 0 리셋. (현재 미활용, 향후 N회 틀리면 explain 자동 전환)

### 노드 간 임시 전달
- **`last_grade_result`**: `{"question_id", "category", "correct", "difficulty"}`. drill/review_node가 채점 후 설정 → state_updater가 읽고 처리 후 `None`으로 초기화. 노드 간 직접 반환값 전달이 불가한 LangGraph 구조에서 채점 결과를 state_updater에 전달하기 위한 설계.

---

## 설계 결정 사항

**Q. `accuracy_by_category`만으로 부족한가?**  
정확한 누적 평균을 갱신하려면 이전 정답 수가 필요. `accuracy × attempts`로 역산하려면 `attempts_by_category`가 필수. 별도 필드로 분리.

**Q. `last_grade_result`를 State에 넣는 이유?**  
LangGraph에서 노드는 다음 노드에 직접 값을 전달할 수 없음. State를 통해서만 공유 가능. drill_node 채점 결과를 state_updater가 읽으려면 State를 경유해야 함. 처리 후 None으로 초기화해 잔류 데이터 오염 방지.

**Q. `review_node`를 별도로 둔 이유?**  
drill_node(`question_history` 기반 랜덤 출제)와 review_node(`recent_mistakes` 기반 오답 출제)는 출제 소스가 다름. 하나의 노드에 if/else로 합치면 책임이 불명확해져 분리.
