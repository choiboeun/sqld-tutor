import os
from langgraph.checkpoint.memory import MemorySaver


def get_checkpointer():
    db_url = os.getenv("DATABASE_URL", "")
    if not db_url:
        return MemorySaver()

    try:
        from langgraph.checkpoint.postgres import PostgresSaver
        from psycopg_pool import ConnectionPool

        pool = ConnectionPool(db_url, min_size=1, max_size=5, open=True)
        saver = PostgresSaver(pool)
        saver.setup()
        return saver
    except Exception as e:
        print(f"[checkpointer] PostgresSaver 실패, MemorySaver로 fallback: {e}")
        return MemorySaver()
