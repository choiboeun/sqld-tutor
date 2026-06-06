import os
from pathlib import Path
from functools import lru_cache

from langchain_core.tools import tool
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma

from app.agent.llm import llm

CHROMA_DIR = Path(__file__).parent.parent.parent / "data" / "chroma_db"

_PROMPT = """당신은 SQLD 자격증 시험 전문 튜터입니다.
아래 [참고 자료]를 바탕으로 개념을 설명하세요.
참고 자료에 없는 내용은 추가하지 마세요.
설명 순서: 개념 정의 → 시험 포인트 → 간단한 예시
수준: {level} (beginner=쉽게, intermediate=표준, advanced=심화)
한국어로 답변하세요.

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
    docs = vectorstore.similarity_search(concept, k=3)
    context = "\n\n---\n\n".join(doc.page_content for doc in docs)

    messages = [
        SystemMessage(content=_PROMPT.format(level=level, context=context)),
        HumanMessage(content=f"{concept}에 대해 설명해주세요."),
    ]
    response = llm.invoke(messages)
    return response.content
