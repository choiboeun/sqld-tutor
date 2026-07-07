import os
from langgraph.checkpoint.memory import MemorySaver

_async_pool = None
_async_saver = None


def get_checkpointer():
    """
    그래프는 async(astream_events)로 실행되므로 AsyncPostgresSaver 필요.
    AsyncConnectionPool은 open=False로 생성 후 FastAPI lifespan에서 open().
    """
    global _async_pool, _async_saver

    db_url = os.getenv("DATABASE_URL", "")
    if not db_url:
        return MemorySaver()

    try:
        from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
        from psycopg_pool import AsyncConnectionPool

        _async_pool = AsyncConnectionPool(
            db_url,
            min_size=1,
            max_size=5,
            open=False,  # FastAPI lifespan에서 await pool.open()
            kwargs={"prepare_threshold": 0},
        )
        _async_saver = AsyncPostgresSaver(_async_pool)
        return _async_saver
    except Exception as e:
        import traceback
        print(f"[checkpointer] AsyncPostgresSaver 생성 실패, MemorySaver로 fallback: {e}")
        traceback.print_exc()
        return MemorySaver()


async def open_checkpointer_pool():
    """FastAPI lifespan startup에서 호출 — async pool을 열고 테이블 확인."""
    global _async_pool, _async_saver
    if _async_pool is None:
        print("[checkpointer] DB 없음, MemorySaver 사용 중")
        return
    try:
        await _async_pool.open()
        print("[checkpointer] AsyncConnectionPool 오픈 완료")
        try:
            await _async_saver.setup()
            print("[checkpointer] AsyncPostgresSaver setup 완료")
        except Exception as e:
            print(f"[checkpointer] setup() 스킵 (테이블 이미 존재): {e}")
    except Exception as e:
        import traceback
        print(f"[checkpointer] pool.open() 실패: {e}")
        traceback.print_exc()
