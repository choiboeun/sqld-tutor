from fastapi import APIRouter, Depends, HTTPException
from app.agent.graph import graph
from app.agent.tools.question_tools import get_question_by_id
from app.auth import get_current_user_id

router = APIRouter()


@router.get("/wrong-answers/{thread_id}")
async def get_wrong_answers(thread_id: str, user_id: str = Depends(get_current_user_id)):
    if thread_id != user_id:
        raise HTTPException(status_code=403, detail="접근 권한이 없어요.")
    config = {"configurable": {"thread_id": thread_id}}
    state = await graph.aget_state(config)

    if not state.values:
        return {"wrong_answers": []}

    wrong_log: dict = state.values.get("wrong_answer_log") or {}
    recent_mistakes: list = state.values.get("recent_mistakes") or []

    result = []
    for qid, student_answer in wrong_log.items():
        q = get_question_by_id(qid)
        if not q:
            continue

        options = q["options"]
        if isinstance(options, dict):
            try:
                opts_list = [{"num": int(k), "text": options[k]} for k in sorted(options.keys(), key=int)]
            except ValueError:
                opts_list = [{"num": i + 1, "text": options[k]} for i, k in enumerate(options.keys())]
        else:
            opts_list = [{"num": i + 1, "text": opt} for i, opt in enumerate(options)]

        result.append({
            "question_id": qid,
            "category": q["category"],
            "difficulty": q["difficulty"],
            "question": q["question"],
            "context": q.get("context", ""),
            "options": opts_list,
            "correct_answer": q.get("answer", 0),
            "student_answer": student_answer,
            "explanation": q.get("explanation", ""),
            "still_wrong": qid in recent_mistakes,
        })

    return {"wrong_answers": result}
