import os
from langgraph.checkpoint.memory import MemorySaver


def get_checkpointer():
    db_url = os.getenv("DATABASE_URL", "")
    if not db_url:
        return MemorySaver()

    try:
        from langgraph.checkpoint.postgres import PostgresSaver
        from psycopg_pool import ConnectionPool
        import psycopg

        # setup()은 CREATE INDEX CONCURRENTLY 때문에 autocommit 필요
        with psycopg.connect(db_url, autocommit=True) as setup_conn:
            PostgresSaver(setup_conn).setup()

        # 실제 체크포인트 읽기/쓰기용 pool (autocommit 없이)
        pool = ConnectionPool(
            db_url,
            min_size=1,
            max_size=5,
            open=True,
            kwargs={"prepare_threshold": 0},
        )
        return PostgresSaver(pool)
    except Exception as e:
        import traceback
        print(f"[checkpointer] PostgresSaver 실패, MemorySaver로 fallback: {e}")
        traceback.print_exc()
        return MemorySaver()
