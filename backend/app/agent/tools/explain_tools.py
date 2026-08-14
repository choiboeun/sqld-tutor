import os
import re
from pathlib import Path
from functools import lru_cache

from langchain_core.tools import tool
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma

from app.agent.llm import llm

CHROMA_DIR = Path(__file__).parent.parent.parent / "data" / "chroma_db"

# SQLD 시험 범위 내 키워드만 볼드 허용 (긴 것 먼저 — 부분 매칭 방지)
_SQLD_KEYWORDS = [
    # 복합 SQL 키워드
    "GROUP BY", "ORDER BY", "PARTITION BY",
    "INNER JOIN", "LEFT OUTER JOIN", "RIGHT OUTER JOIN", "FULL OUTER JOIN",
    "LEFT JOIN", "RIGHT JOIN", "FULL JOIN", "CROSS JOIN",
    "UNION ALL", "GROUPING SETS",
    "IS NOT NULL", "NOT EXISTS", "NOT IN",
    "IS NULL", "EXISTS",
    "PRIMARY KEY", "FOREIGN KEY", "NOT NULL",
    "ON DELETE CASCADE", "ON DELETE SET NULL",
    # 단일 SQL 키워드
    "ROW_NUMBER", "DENSE_RANK", "PERCENT_RANK", "CUME_DIST", "RATIO_TO_REPORT",
    "ROLLUP", "CUBE", "PIVOT", "UNPIVOT",
    "SELECT", "FROM", "WHERE", "HAVING", "JOIN",
    "UNION", "INTERSECT", "MINUS", "EXCEPT",
    "INSERT", "UPDATE", "DELETE", "MERGE",
    "CREATE", "ALTER", "DROP", "TRUNCATE",
    "GRANT", "REVOKE", "COMMIT", "ROLLBACK", "SAVEPOINT",
    "DISTINCT", "BETWEEN", "LIKE",
    "CASE", "WHEN", "THEN", "ELSE", "END",
    "COUNT", "SUM", "AVG", "MAX", "MIN",
    "RANK", "NTILE", "LAG", "LEAD",
    "OVER", "WITH", "ROWNUM", "ROWID",
    "NVL", "NVL2", "DECODE", "COALESCE", "NULLIF",
    "SUBSTR", "INSTR", "TRIM", "REPLACE",
    "TO_CHAR", "TO_DATE", "TO_NUMBER",
    "SYSDATE", "DUAL", "SEQUENCE", "SYNONYM",
    "UNIQUE", "NULL",
    # 약어
    "RDBMS", "DBMS", "DDL", "DML", "DCL", "TCL", "RDB", "ERD", "SQL",
    # 한국어 개념명 (긴 것 먼저)
    "제1정규형", "제2정규형", "제3정규형", "BCNF",
    "참조 무결성", "개체 무결성", "도메인 무결성",
    "함수 종속", "이행 종속", "부분 종속",
    "클러스터형 인덱스", "비클러스터형 인덱스",
    "집합 연산자", "윈도우 함수", "집계 함수", "그룹 함수",
    "계층형 쿼리", "분산 데이터베이스", "격리 수준",
    "기본키", "외래키", "후보키", "슈퍼키", "대리키",
    "시험 포인트", "핵심 포인트",
    "반정규화", "정규화", "무결성", "트랜잭션", "인덱스",
    "파티션", "서브쿼리", "조인", "뷰", "시퀀스",
    "엔터티", "속성", "관계", "식별자",
    "교착 상태", "옵티마이저",
    "카디널리티", "도메인",
]


def _apply_keyword_bold(content: str) -> str:
    # 코드 블록을 플레이스홀더로 보호 (코드 블록 안에는 ** 적용 안 함)
    code_blocks: list[str] = []

    def save_block(m: re.Match) -> str:
        code_blocks.append(m.group())
        return f'\x00BLOCK{len(code_blocks) - 1}\x00'

    content = re.sub(r'```[\s\S]*?```', save_block, content)

    # Step 1: LLM이 생성한 볼드 전부 제거 (비코드 구간만)
    content = re.sub(r'\*\*([^*\n]+)\*\*', r'\1', content)

    # Step 2: 키워드 목록 순서대로 볼드 추가 (비코드 구간만)
    for kw in _SQLD_KEYWORDS:
        escaped = re.escape(kw)
        if re.search(r'[a-zA-Z0-9]', kw):
            kw_pat = r'\b' + escaped + r'\b'
            flags = re.IGNORECASE
        else:
            kw_pat = escaped
            flags = 0
        pattern = re.compile(r'\*\*[^*\n]+\*\*|' + kw_pat, flags)
        content = pattern.sub(
            lambda m: m.group() if m.group().startswith('**') else f'**{m.group()}**',
            content,
        )

    # 코드 블록 복원 (LLM이 넣은 ** 도 안전하게 제거)
    for i, block in enumerate(code_blocks):
        clean = re.sub(r'\*\*([^*]+)\*\*', r'\1', block)
        content = content.replace(f'\x00BLOCK{i}\x00', clean)

    return content

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
    # LLM 볼드 전부 제거 후 SQLD 키워드만 재적용
    content = _apply_keyword_bold(content)
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
    content = re.sub(r'(?<=[A-Za-z\s])\*(?=[\s,\n]|$)', r'\\*', content)
    return content.strip()
