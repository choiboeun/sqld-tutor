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
- **굵게** 표시할 때는 뒤에 오는 조사(은/는/이/가/을/를/으로/에서 등)를 볼드 안에 포함하세요.
  올바른 예: **ERD는**, **정규화를**, **JOIN이** / 틀린 예: **ERD**는, **정규화**를
- 불릿(•)은 3개 이상 나열할 때만 사용하고, 단순 설명은 문장으로 작성하세요.
  하위 항목은 2칸 들여쓰기로 계층을 표현하세요:
  • 상위 항목 설명
    • 하위 항목 1
    • 하위 항목 2
- 마지막에 "---\n> 다음 문제를 풀려면 **문제 줘**, 더 궁금한 개념은 직접 입력하세요." 를 추가하세요.

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


@tool
def explain_concept(concept: str, level: str = "beginner") -> str:
    """SQLD 개념을 학습 자료 기반(RAG)으로 학생 수준에 맞게 설명한다.
    concept: 설명할 개념 (예: 'JOIN', 'HAVING', 'ROLLUP')
    level: 학생 수준 ('beginner', 'intermediate', 'advanced')
    """
    from langchain_core.messages import HumanMessage, SystemMessage

    if not concept or not concept.strip():
        concept = "SQLD 개념"

    vectorstore = _get_vectorstore()
    docs = vectorstore.similarity_search(concept, k=5)
    context = "\n\n---\n\n".join(doc.page_content for doc in docs)

    messages = [
        SystemMessage(content=_PROMPT.format(level=level, context=context)),
        HumanMessage(content=f"{concept}에 대해 설명해주세요."),
    ]
    response = llm.invoke(messages)
    content = response.content
    print(f"[explain] concept={concept!r}, raw_len={len(content)}, preview={repr(content[:120])}")
    # "** text **", "** text**", "**text **" → "**text**"
    content = re.sub(r'\*\*\s*([^*\n]+?)\s*\*\*', lambda m: f'**{m.group(1).strip()}**', content)
    # 인라인 불릿(줄 중간의 •) → 새 줄 불릿으로 분리
    content = re.sub(r'([^\n])\s*•\s*', r'\1\n- ', content)
    # 들여쓰기 있는 서브불릿(\n  • 또는 \n\t•) → \n  - (마크다운 중첩 리스트)
    content = re.sub(r'\n([ \t]+)•\s*', lambda m: f'\n{"  " * (len(m.group(1).expandtabs(2)) // 2)}- ', content)
    # 최상위 불릿 \n• → \n-
    content = re.sub(r'\n•\s*', '\n- ', content)
    print(f"[explain] processed_len={len(content)}, preview={repr(content[:120])}")
    return content.strip()
