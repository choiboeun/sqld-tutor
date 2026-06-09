from typing import Annotated, Optional, TypedDict
from langgraph.graph.message import add_messages


class TutorState(TypedDict):
    # 대화
    messages: Annotated[list, add_messages]

    # 모드 제어
    current_mode: str               # "drill" | "review" | "explain" | "diagnose" | "chat"

    # 문제 관리
    pending_question: dict          # 채점 대기 중인 문제 (id, question, options, answer, category 등)
    question_history: list[str]     # 출제된 문제 id 목록 — 중복 출제 방지
    last_category: Optional[str]    # 직전 출제 카테고리 — 연속 동일 카테고리 방지

    # 학생 프로필
    student_level: str              # "beginner" | "intermediate" | "advanced"
    target_score: int               # 목표 점수 (SQLD 합격선 기본 60)
    difficulty_preference: str      # "low" | "mid" | "high" | "mix"

    # 성과 추적
    accuracy_by_category: dict[str, float]  # 11개 카테고리별 정답률 (0.0~1.0)
    attempts_by_category: dict[str, int]    # 카테고리별 시도 횟수 — accuracy 갱신에 필요
    recent_mistakes: list[str]              # 최근 오답 문제 id 목록
    total_answered: int                     # 누적 총 풀이 수
    session_question_count: int             # 세션 내 풀이 수

    # 연속 기록
    streak: int                     # 연속 정답 수 — 난이도·카테고리 전환 트리거
    consecutive_wrong: int          # 연속 오답 수 — explain 자동 전환 트리거
    retry_count: int                # 현재 문제 재시도 횟수 — 개념 설명 전환 기준

    # 노드 간 임시 전달
    last_grade_result: Optional[dict]  # drill/review → state_updater 채점 결과 전달 후 None으로 초기화

    # 적응형 학습 신호
    suggest_category_switch: bool      # streak >= 3 달성 시 True → drill_node가 다른 카테고리 선택
    last_explained_category: Optional[str]  # 적응형 explain이 실행된 카테고리 — 정답 전까지 재실행 방지
    last_wrong_tags: Optional[list[str]]    # 직전 오답 문제의 태그 — 정확한 개념 설명에 사용

    # 분석용
    user_id: Optional[str]  # Supabase user.id — 이벤트 로깅에 사용

    # 온보딩 초기 진단
    is_diagnostic: bool  # True 동안 8문제 자동 출제 → 완료 시 약점 리포트 자동 실행
