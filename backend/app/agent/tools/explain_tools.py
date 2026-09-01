import os
import re
from pathlib import Path
from functools import lru_cache

from langchain_core.tools import tool
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma

from app.agent.llm import llm

CHROMA_DIR = Path(__file__).parent.parent.parent / "data" / "chroma_db"

_PROMPT = """당신은 SQLD 자격증 시험 전문 튜터입니다.
아래 [참고 자료]를 바탕으로 개념을 설명하세요.
설명 순서: 개념 정의 → 시험 포인트 → 간단한 예시
수준: {level} (beginner=쉽게, intermediate=표준, advanced=심화)
한국어로 ~해요체(친근한 존댓말)로 일관되게 답변하세요. ~습니다체는 사용하지 마세요.

형식 규칙:
- 제목은 ## 형식을 사용하세요. 숫자 번호(1. 2. 3.)로 섹션을 나누지 마세요.
- 제목 아래에 반드시 실제 설명 내용을 작성하세요.
- **굵게** 표시는 SQL 키워드, 개념명, 시험 포인트 제목에만 사용하세요. '데이터', '테이블', '방식', '특징' 같은 일반 단어에는 절대 사용하지 마세요.
  올바른 예: **GROUP BY**, **UNPIVOT**, **시험 포인트** / 틀린 예: **데이터를**, **방식이**, **테이블의**
- 코드 블록(```sql ... ```) 안에서는 ** 마크다운을 절대 사용하지 마세요. 코드 블록 안은 순수 SQL 코드만 작성하세요.
  틀린 예: ```sql **SELECT** col **FROM** tbl ``` / 올바른 예: ```sql SELECT col FROM tbl ```
- SQL 구문 설명에서 선택지(ASC|DESC, ROWS|RANGE 등)를 나타낼 때 파이프(|)는 코드 블록 안에서만 사용하세요. 코드 블록 밖 일반 텍스트에서는 슬래시(/)로 대체하세요.
  틀린 예: ORDER BY 컬럼 ASC|DESC (코드 블록 밖) / 올바른 예: ORDER BY 컬럼 ASC/DESC (코드 블록 밖)
- 볼드 단어에 조사(은/는/이/가/을/를/으로/에서)가 붙을 때는 조사를 볼드 안에 포함하세요.
  올바른 예: **JOIN이**, **정규화를** / 틀린 예: **JOIN**이, **정규화**를
- 이탤릭(*기울임*)은 절대 사용하지 마세요.
- 불릿(•)은 3개 이상 나열할 때만 사용하고, 단순 설명은 문장으로 작성하세요.
  하위 항목은 2칸 들여쓰기로 계층을 표현하세요:
  • 상위 항목 설명
    • 하위 항목 1
    • 하위 항목 2
- "안녕하세요", "안녕" 같은 인사말로 시작하지 마세요. 바로 개념 설명으로 시작하세요.
- "자세히 설명해 드릴게요", "살펴볼게요", "알아볼게요", "설명하겠습니다" 같은 메타 도입 문구 없이 바로 내용을 작성하세요.
- 제목(##) 아래에 반드시 실제 설명 내용을 작성하세요. 제목만 쓰고 내용을 빠뜨리면 안 됩니다.
- 마지막에 "---\n> 더 궁금한 개념은 직접 입력하세요." 를 추가하세요.

[참고 자료]
{context}"""


@lru_cache(maxsize=1)
def _get_vectorstore() -> Chroma:
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        google_api_key=os.getenv("GEMINI_API_KEY"),
    )
    return Chroma(
        collection_name="sqld_concepts",
        embedding_function=embeddings,
        persist_directory=str(CHROMA_DIR),
    )


# similarity_search 결과 캐시 — 같은 개념은 서버 수명 동안 API 재호출 없음
_search_cache: dict[str, list] = {}


def _cached_search(concept: str, k: int = 5) -> list:
    key = concept.strip().lower()
    if key not in _search_cache:
        try:
            vectorstore = _get_vectorstore()
            _search_cache[key] = vectorstore.similarity_search(concept, k=k)
        except Exception as e:
            # 임베딩 API 실패(429 등) → 빈 리스트 반환, 캐시에 저장하지 않음
            print(f"[_cached_search] 임베딩 API 실패 ({type(e).__name__}): {e}")
            return []
    return _search_cache[key]


@tool
def explain_concept(concept: str, level: str = "beginner") -> str:
    """SQLD 개념을 학습 자료 기반(RAG)으로 학생 수준에 맞게 설명한다.
    concept: 설명할 개념 (예: 'JOIN', 'HAVING', 'ROLLUP')
    level: 학생 수준 ('beginner', 'intermediate', 'advanced')
    """
    from langchain_core.messages import HumanMessage, SystemMessage

    if not concept or not concept.strip():
        concept = "SQLD 개념"

    docs = _cached_search(concept)
    # RAG 실패 시에도 LLM 자체 지식으로 설명 — 게스트 임베딩 API 쿼터 소진 시 fallback
    context = "\n\n---\n\n".join(doc.page_content for doc in docs) if docs else ""

    prompt_context = context if context else "참고 자료 없음 — SQLD 시험 범위 내 일반 지식으로 설명하세요."
    messages = [
        SystemMessage(content=_PROMPT.format(level=level, context=prompt_context)),
        HumanMessage(content=f"{concept}에 대해 설명해주세요."),
    ]
    response = llm.invoke(messages)
    content = response.content
    # 인라인 * 단독 불릿 → 줄바꿈 불릿 (AI가 줄 바꿈 없이 "텍스트 * 항목" 형태로 쓸 때 수정)
    content = re.sub(r'(?<=[^\*\n]) \* (?!\*)', '\n- ', content)
    # 인라인 불릿(줄 중간의 •) → 새 줄 불릿으로 분리
    content = re.sub(r'([^\n])\s*•\s*', r'\1\n- ', content)
    # 들여쓰기 있는 서브불릿(\n  • 또는 \n\t•) → \n  - (마크다운 중첩 리스트)
    content = re.sub(r'\n([ \t]+)•\s*', lambda m: f'\n{"  " * (len(m.group(1).expandtabs(2)) // 2)}- ', content)
    # 최상위 불릿 \n• → \n-
    content = re.sub(r'\n•\s*', '\n- ', content)
    # "다음 문제를 풀려면 문제 줘" 안내 문장 제거 (UI 버튼으로 대체)
    content = re.sub(r'\n*-{0,3}\n*>\s*다음 문제를 풀려면.*$', '', content, flags=re.MULTILINE)
    # COUNT(*), SELECT * 등 SQL 별표가 마크다운 이탤릭으로 소비되는 문제 방지
    content = re.sub(r'\(\*\)', r'(\\*)', content)
    # \n 은 줄 시작 * 불릿마커이므로 이스케이프 제외 → [ \t] 만 허용
    content = re.sub(r'(?<=[A-Za-z \t])\*(?=[\s,\n]|$)', r'\\*', content)
    return content.strip()
