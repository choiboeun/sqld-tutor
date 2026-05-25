from typing import Annotated, TypedDict
from langgraph.graph.message import add_messages


class TutorState(TypedDict):
    messages: Annotated[list, add_messages]
    current_mode: str        # "drill" | "explain" | "diagnose"
    pending_question: dict   # 현재 출제된 문제 (아직 채점 안 된 상태)
