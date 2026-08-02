import os
from langgraph.checkpoint.memory import MemorySaver

_async_pool = None
_async_saver = None


def get_checkpointer():
    """
    AsyncPostgresSaver.__init__() 는 asyncio.get_running_loop() 을 호출하므로
    모듈 임포트 시점(이벤트 루프 없음)에 생성하면 RuntimeError 로 MemorySaver fallback 됨.
    → pool 만 미리 생성하고, AsyncPostgresSaver 는 open_checkpointer_pool() 에서 생성.
    graph 는 일단 MemorySaver 로 컴파일되며, lifespan 완료 후 graph.checkpointer 교체.
    """
    global _async_pool

    db_url = os.getenv("DATABASE_URL", "")
    if not db_url:
        print("[checkpointer] DATABASE_URL 없음, MemorySaver 사용", flush=True)
        return MemorySaver()

    try:
        from psycopg_pool import AsyncConnectionPool

        _async_pool = AsyncConnectionPool(
            db_url,
            min_size=1,
            max_size=5,
            open=False,
            kwargs={"prepare_threshold": None},
        )
        print("[checkpointer] AsyncConnectionPool 생성 완료 (미오픈)", flush=True)
        return MemorySaver()  # lifespan 에서 AsyncPostgresSaver 로 교체 예정
    except Exception as e:
        import traceback
        import logging
        logging.error("[checkpointer] AsyncConnectionPool 생성 실패 → MemorySaver fallback (대화 기록이 재시작 시 초기화됩니다): %s", e)
        traceback.print_exc()
        return MemorySaver()


async def open_checkpointer_pool():
    """
    FastAPI lifespan startup 에서 호출.
    async 컨텍스트에서 AsyncPostgresSaver 를 생성하고 pool 을 열어
    graph.checkpointer 를 교체한다.
    """
    global _async_pool, _async_saver

    if _async_pool is None:
        print("[checkpointer] pool 없음, MemorySaver 유지", flush=True)
        return

    try:
        from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

        _async_saver = AsyncPostgresSaver(_async_pool)  # async 컨텍스트에서 생성

        await _async_pool.open()
        print("[checkpointer] AsyncConnectionPool 오픈 완료", flush=True)

        try:
            await _async_saver.setup()
            print("[checkpointer] AsyncPostgresSaver setup 완료", flush=True)
        except Exception as e:
            import logging
            logging.warning("[checkpointer] setup() 스킵 (테이블 이미 존재): %s", e)

        from app.agent.graph import graph
        graph.checkpointer = _async_saver
        print("[checkpointer] graph.checkpointer → AsyncPostgresSaver 교체 완료", flush=True)

    except Exception as e:
        import traceback
        import logging
        logging.error("[checkpointer] pool.open() 실패 → MemorySaver 유지 (대화 기록이 재시작 시 초기화됩니다): %s", e)
        traceback.print_exc()
