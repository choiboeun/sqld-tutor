# SQLD AI Tutor Project — CLAUDE.md

## 프로젝트 개요

**목표:** SQLD 자격증 합격을 돕는 LangGraph 기반 AI 튜터 웹 서비스  
**기간:** 16주 (2026-05-06 ~)  
**운영자:** 컴퓨터공학과 전공 (데이터베이스 수업 이수, SQL 기초 보유)  
**SQLD 합격:** 2026-03-27 (실제 응시자 경험 보유)

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| AI Agent | LangGraph (Python) |
| Backend | FastAPI |
| Frontend | Next.js 14 |
| DB / Auth | Supabase |
| Memory | MemorySaver → PostgresSaver (checkpointing) |
| RAG | 개념 설명용 Retrieval Augmented Generation |
| Observability | LangSmith |
| LLM | Claude API (claude-sonnet-4-6 기본, 최신 모델 우선) |

---

## 핵심 State 스키마

```python
# accuracy_by_category: 11개 카테고리별 정답률 (0.0 ~ 1.0)
# 2024년 개정 기준 반영 (절차형 SQL 삭제, TOP N/PIVOT/정규표현식 추가)
accuracy_by_category = {
    "데이터 모델링 기초": 0.0,
    "데이터 모델과 SQL": 0.0,
    "SELECT & WHERE": 0.0,
    "함수": 0.0,
    "GROUP BY & ORDER BY": 0.0,
    "조인": 0.0,
    "서브쿼리 & Top N": 0.0,
    "집합 연산자 & 그룹 함수": 0.0,
    "윈도우 함수": 0.0,
    "SQL 활용 기타": 0.0,
    "관리 구문": 0.0,
}
```

---

## 4단계 개발 계획

| 단계 | 주차 | Gate | 목표 |
|------|------|------|------|
| Phase 0-A | 1~4주 | Gate 1 | 문제 은행 + LangGraph Walking Skeleton |
| Phase 0-B | 5~8주 | Gate 2 | 핵심 기능 MVP (문제 출제 + 오답 복습) |
| Phase 1-A | 9~12주 | Gate 3 | 약점 분석 + RAG 개념 설명 |
| Phase 1-B | 13~16주 | Gate 4 | 베타 테스트 5명 + 포트폴리오 완성 |

---

## 주차별 진행 현황

### ✅ 1주차 (완료)
- [x] SQLD 합격 회고 작성
- [x] 사용자 인터뷰 5명 (네이버 폼) → 보고서 작성
- [x] 페인포인트 Top 5 도출
- [x] 카테고리 분류표 10개 작성

**산출물 위치:** `docs/week1/`
- `interview_report.md` — 5인 인터뷰 분석 보고서
- `pain_points_top5.md` — 페인포인트 Top 5 (근거 포함)
- `category_table.md` — SQLD 출제범위 10개 카테고리

### ✅ 2주차 (완료)
- [x] 라이선스 검토 → 자체 생성 방향 확정 (저작권 문제 없음)
- [x] 기출 2회차 교차 분석 → 카테고리별 문제 유형 분포표 작성
- [x] 문제 데이터셋 스키마 설계 (schema_v0.1.md)
- [x] GPT로 SQLD 문제 110개 생성 (11개 카테고리 × 10문제)
- [x] 문제 검수 완료 (오류 수정 3건, 답안 편중 해소)

**산출물 위치:** `docs/week2/`
- `license_review.md` — 라이선스 검토 결과
- `dataset_strategy.md` — 데이터셋 전략 결정서
- `schema_v0.1.md` — 문제 JSONL 스키마 정의
- `question_type_distribution.md` — 카테고리별 문제 유형 분포표

**데이터 위치:** `data/questions_v0.1.jsonl`
- 110문제 (11카테고리 × 10문제), verified: false
- 검수 수정 이력: q032 데이터 오류(KIM→KANG), Cat1·Cat6 답안 편중 해소, q034·q107 문장 품질 개선
- 난이도(difficulty): 교수님 협의 후 확정 예정 → 현재 null

### ⏳ 3주차 (예정)
- [ ] 기술 스택 검토 및 확정 (핸드북 5장 기준, 본인 상황에 맞게 조정)
- [ ] GitHub 레포지토리 생성 (private), 폴더 구조 셋업
- [ ] .env 관리, .gitignore, requirements.txt 작성
- [ ] API 키 발급 (Gemini Flash, LangSmith), 무료 크레딧 확인
- [ ] Supabase 인스턴스 생성, 테이블 스키마 초기 설계
- [ ] 아키텍처 다이어그램 작성 (코드 1줄 안 짠 상태에서): State 스키마 / 노드 6개 + 엣지 + 라우팅 / 도구 4~5개 명세 / 데이터 흐름도
- [x] 난이도 기준 교수님 협의 (문제 유형 기반 방향 동의, 2026-05-15)

**산출물:** 기술 스택 결정서 + 시스템 아키텍처 다이어그램 (v0.1)

### ⏳ 4주차 (예정, Gate 1)
- [ ] LangGraph Walking Skeleton 구현
- [ ] Gate 1 체크리스트 통과

---

## 주요 페인포인트 (인터뷰 기반)

1. **취약점 파악 어려움** — 어디가 약한지 모름 (4건)
2. **개념→문제 적용 갭** — 알아도 문제에 적용 못함 (4건)
3. **오답 복습 비효율** — 틀린 문제 재복습 체계 없음 (3건)
4. **해설 불충분** — 왜 틀렸는지 이해 안 됨 (3건)
5. **공부 방향 불확실** — 뭘 먼저 해야 할지 모름 (1건, 추가 검증 필요)

---

## 주의 사항

- 인터뷰 샘플 5명으로 일반화 금지 — 가설로만 기록, 베타 테스트에서 검증
- 카테고리 분류표는 한국데이터산업진흥원 공식 출제기준 PDF와 대조 필요
- 문제 생성 시 저작권 이슈 → 자체 창작으로 해결 완료 (2주차)
- 카테고리는 2024년 개정 기준 11개로 확정 (교수님 승인 2026-05-13)
- 난이도 기준(상/중/하) 미확정 → 교수님 협의 후 questions_v0.1.jsonl 업데이트 필요
