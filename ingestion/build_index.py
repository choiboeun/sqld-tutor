"""
SQLD 튜터 RAG 인덱싱 스크립트
마크다운 파일 → 섹션 단위 청킹 → Chroma 저장

실행: python ingestion/build_index.py  (backend 디렉토리에서)
"""

import os
import sys
import time
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / "backend" / ".env")

# 경로 설정
WEEK7_DIR = Path(__file__).parent.parent / "docs" / "week7"
CHROMA_DIR = Path(__file__).parent.parent / "backend" / "app" / "data" / "chroma_db"

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))


def load_and_chunk_markdown(file_path: Path) -> list[dict]:
    """마크다운 파일을 ## 섹션 단위로 청킹."""
    text = file_path.read_text(encoding="utf-8")
    lines = text.splitlines()

    # 파일 상단 메타 추출 (카테고리명, 출처)
    category = ""
    for line in lines[:5]:
        if line.startswith("# 카테고리"):
            category = line.replace("# ", "").strip()
            break

    chunks = []
    current_section = ""
    current_lines = []

    for line in lines:
        if line.startswith("## ") and current_lines:
            content = "\n".join(current_lines).strip()
            if content and len(content) > 50:
                chunks.append({
                    "content": f"[{category}] {current_section}\n\n{content}",
                    "category": category,
                    "section": current_section,
                    "source": file_path.name,
                })
            current_section = line.replace("## ", "").strip()
            current_lines = []
        else:
            current_lines.append(line)

    # 마지막 섹션 처리
    if current_lines:
        content = "\n".join(current_lines).strip()
        if content and len(content) > 50:
            chunks.append({
                "content": f"[{category}] {current_section}\n\n{content}",
                "category": category,
                "section": current_section,
                "source": file_path.name,
            })

    return chunks


def split_by_subsection(chunk: dict) -> list[dict]:
    """## 청크를 ### 단위로 항상 분할. ### 없으면 원본 반환."""
    lines = chunk["content"].splitlines()

    # ### 헤더가 없으면 분할 불필요
    if not any(l.startswith("### ") for l in lines):
        return [chunk]

    sub_chunks = []
    current_lines = []
    sub_section = ""

    for line in lines:
        if line.startswith("### ") and current_lines:
            content = "\n".join(current_lines).strip()
            if content and len(content) > 50:
                sub_chunks.append({
                    **chunk,
                    "content": content,
                    "section": f"{chunk['section']} > {sub_section}" if sub_section else chunk["section"],
                })
            sub_section = line.replace("### ", "").strip()
            current_lines = [line]
        else:
            current_lines.append(line)

    if current_lines:
        content = "\n".join(current_lines).strip()
        if content and len(content) > 50:
            sub_chunks.append({
                **chunk,
                "content": content,
                "section": f"{chunk['section']} > {sub_section}" if sub_section else chunk["section"],
            })

    return sub_chunks if sub_chunks else [chunk]


def build_index():
    from langchain_google_genai import GoogleGenerativeAIEmbeddings
    from langchain_chroma import Chroma
    from langchain_core.documents import Document

    print("=== SQLD RAG 인덱싱 시작 ===\n")

    # 1. 마크다운 파일 로드 및 청킹
    all_chunks = []
    md_files = sorted(WEEK7_DIR.glob("cat*.md"))

    for md_file in md_files:
        chunks = load_and_chunk_markdown(md_file)
        # ### 단위로 항상 재분할
        final_chunks = []
        for chunk in chunks:
            final_chunks.extend(split_by_subsection(chunk))
        all_chunks.extend(final_chunks)
        print(f"  {md_file.name}: {len(final_chunks)}개 청크")

    print(f"\n총 청크 수: {len(all_chunks)}개")

    # 2. LangChain Document 변환
    documents = []
    for i, chunk in enumerate(all_chunks):
        doc = Document(
            page_content=chunk["content"],
            metadata={
                "id": f"chunk_{i:03d}",
                "category": chunk["category"],
                "section": chunk["section"],
                "source": chunk["source"],
            },
        )
        documents.append(doc)

    # 3. 임베딩 모델
    print("\n임베딩 모델 초기화 (gemini-embedding-001)...")
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        google_api_key=os.getenv("GEMINI_API_KEY"),
    )

    # 4. Chroma 저장 (배치 처리로 rate limit 회피)
    # 기존 컬렉션 초기화 (재실행 시 중복 방지)
    import shutil
    if CHROMA_DIR.exists():
        shutil.rmtree(CHROMA_DIR)
        print("기존 Chroma DB 삭제 완료")
    CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Chroma 저장 경로: {CHROMA_DIR}")

    BATCH_SIZE = 10
    SLEEP_SEC = 15
    MAX_RETRY = 4

    vectorstore = None
    batches = [documents[i:i+BATCH_SIZE] for i in range(0, len(documents), BATCH_SIZE)]
    print(f"배치 처리: {len(batches)}개 배치 × {BATCH_SIZE}개 / 배치 간격: {SLEEP_SEC}초")
    print("(총 소요 시간 약 3~5분 예상)\n")

    for i, batch in enumerate(batches):
        for attempt in range(MAX_RETRY):
            try:
                print(f"  배치 {i+1}/{len(batches)} 인덱싱 중...", end=" ", flush=True)
                if vectorstore is None:
                    vectorstore = Chroma.from_documents(
                        documents=batch,
                        embedding=embeddings,
                        collection_name="sqld_concepts",
                        persist_directory=str(CHROMA_DIR),
                    )
                else:
                    vectorstore.add_documents(batch)
                print("완료")
                break
            except Exception as e:
                wait = SLEEP_SEC * (attempt + 2)
                print(f"재시도 {attempt+1}/{MAX_RETRY} (대기 {wait}초): {e}")
                time.sleep(wait)
        else:
            print(f"  ❌ 배치 {i+1} 실패 — 건너뜀")

        if i < len(batches) - 1:
            time.sleep(SLEEP_SEC)

    print(f"\n✅ 인덱싱 완료! {len(documents)}개 청크 저장됨")

    # 5. 검색 테스트
    print("\n--- 검색 테스트 ---")
    test_queries = ["JOIN이 뭐야?", "정규화란?", "ROLLUP 함수"]
    for q in test_queries:
        results = vectorstore.similarity_search(q, k=1)
        print(f"Q: {q}")
        print(f"  → [{results[0].metadata['section']}] {results[0].page_content[:80]}...")
        print()


if __name__ == "__main__":
    build_index()
