import os
from langgraph.checkpoint.memory import MemorySaver

def get_checkpointer():
    db_url = os.getenv("DATABASE_URL", "")
    if not db_url:
        return MemorySaver()

    try:
        from langgraph.checkpoint.postgres import PostgresSaver
        import psycopg

        # PostgresSaver는 psycopg3 connection string 필요
        # postgresql://... → postgresql+psycopg://... 변환 불필요 (psycopg3 직접 사용)
        conn = psycopg.connect(db_url)
        saver = PostgresSaver(conn)
        saver.setup()  # 체크포인트 테이블 자동 생성
        return saver
    except Exception as e:
        print(f"[checkpointer] PostgresSaver 실패, MemorySaver로 fallback: {e}")
        return MemorySaver()
