# 기술 스택 결정서

**작성일:** 2026-05-15  
**기준:** 핸드북 5장 추천 스택 + 본인 상황 반영  

---

## 1. 확정 스택

| 영역 | 확정 | 대안 (검토) | 선택 근거 |
|------|------|------------|---------|
| 언어 | Python 3.11+ | — | LangGraph가 Python 우선 |
| 에이전트 | LangGraph | LlamaIndex Agents | 수업에서 학습한 그대로. 멀티턴/메모리/스트리밍 지원 |
| LLM (메인) | Gemini Flash | gpt-4.1-mini | 실시간 응답 비용 절감. 교수님 협의 결과 (2026-05-15) |
| LLM (평가/생성) | Claude API | gpt-4o | 교수님이 제공. 문제 생성·데이터 분석 등 배치 작업에 활용 |
| 임베딩 | text-embedding-3-small | bge-m3 (무료) | 비용 효율적, 한국어 성능 충분 |
| 벡터 DB | Chroma → Pinecone Free | Qdrant, Weaviate | 개발: Chroma(로컬), 배포: Pinecone(영속성) |
| 백엔드 | FastAPI | Flask, Django | 비동기 우수, OpenAPI 자동 생성 |
| DB / 인증 | Supabase (Postgres + Auth) | 자체 Postgres + Auth0 | 통합 관리. 카카오 로그인 클릭으로 가능 |
| 체크포인터 | PostgresSaver | SqliteSaver (개발용) | Supabase와 동일 DB로 운영 단순화 |
| 프론트엔드 | Next.js 14 + TypeScript | SvelteKit, Remix | React 생태계 풍부, Vercel 무료 배포 |
| UI | shadcn/ui + Tailwind | Mantine, Chakra UI | 무료, 커스터마이징 유연, AI 챗 예제 풍부 |
| 채팅 UI | Vercel AI SDK | 직접 SSE 처리 | useChat 훅 한 줄로 스트리밍 처리 |
| 배포 (백엔드) | Railway | Render, Fly.io | 무료 크레딧, Postgres 통합 |
| 배포 (프론트) | Vercel | Netlify, Cloudflare | Next.js 최적화 |
| 관찰성 | LangSmith | Langfuse | LangGraph와 한 줄 연동, 무료 5천 trace/월 |
| 에러 추적 | Sentry | Highlight | 무료로 시작 |
| 분석 | PostHog | Mixpanel | 무료 100만 이벤트/월 |
| 결제 | 토스페이먼츠 | KakaoPay | Phase 2에서 구현. Phase 1 미포함 |

---

## 2. 핸드북 원안 대비 변경 사항

| 항목 | 핸드북 원안 | 확정 | 변경 이유 |
|------|-----------|------|---------|
| LLM (메인) | OpenAI gpt-4.1-mini | Gemini Flash | 온라인 서비스 실시간 응답 비용 절감. 교수님 협의 결과 |
| LLM (평가/생성) | OpenAI gpt-4o | Claude API | 교수님이 직접 제공. 배치 작업에만 사용 |

---

## 3. LLM 용도 구분

실시간 서비스에서 LLM이 필요한 경우는 세 가지로 한정한다.

| 용도 | 모델 | 설명 |
|------|------|------|
| 의도 파악 | Gemini Flash | 사용자 입력이 문제 요청인지, 질문인지 분류 |
| 오답 추가 해설 | Gemini Flash | explanation 필드 표시 후 추가 질문 시 대화 응답 |
| 개념 설명 (RAG) | Gemini Flash | SQLD 개념 자료 검색 후 설명 생성 |

배치 작업(문제 추가 생성, 데이터 분석 보고서 등)은 Claude API 사용.

---

## 4. 비용 추정 (16주)

| 항목 | 예상 비용 | 비고 |
|------|---------|------|
| Gemini Flash (개발 + 베타 5명 30일) | 약 5~15달러 | gpt-4.1-mini 대비 저렴 |
| Claude API | 0원 | 교수님 제공 |
| Supabase | 0원 | Free 티어 |
| Railway | 0~5달러 | 무료 크레딧 |
| Vercel | 0원 | Free 티어 |
| Pinecone | 0원 | Free 티어 |
| LangSmith | 0원 | Free 티어 |
| Sentry | 0원 | Free 티어 |
| 도메인 (1년) | 1~2만원 | .com 권장 |
| 베타 사용자 보상 | 25만원 | 5만원 × 5명 |
| **합계** | **약 27~30만원** | 학기 전체 |
