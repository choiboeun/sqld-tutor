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
한국어로 답변하세요.

형식 규칙:
- 제목은 ## 형식을 사용하세요. 절대로 1. 2. 3. 4. 숫자 번호로 섹션을 나누지 마세요.
- 제목만 나열하지 말고 각 섹션의 실제 설명 내용을 반드시 작성하세요.
- 세부 항목은 • 불릿 포인트를 사용하되, **반드시 각 항목을 별도 줄에 작성하세요**.
  올바른 예시:
  • 첫 번째 항목 설명

  • 두 번째 항목 설명

  • 세 번째 항목 설명
  (여러 항목을 한 줄에 쓰지 마세요)
- **중요 개념**은 굵게 표시하세요. ** 기호는 단어 바로 앞뒤에 공백 없이 붙여 쓰세요.
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
    # "** text **" → "**text**" (LLM이 ** 안쪽에 공백을 넣는 경우 수정)
    content = re.sub(r'\*\*\s+(.+?)\s+\*\*', lambda m: f'**{m.group(1)}**', content)
    # 줄 중간에 있는 모든 • 앞에 \n\n 추가 (비줄바꿈 문자 뒤에 오는 •)
    content = re.sub(r'([^\n])\s*•\s*', r'\1\n\n• ', content)
    # 들여쓰기 서브불릿(\n  •)과 단순 \n• 모두 \n\n• 으로 통일
    content = re.sub(r'\n[ \t]*•', '\n\n•', content)
    print(f"[explain] processed_len={len(content)}, preview={repr(content[:120])}")
    return content.strip()
