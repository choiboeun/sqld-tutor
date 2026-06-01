from langchain_core.tools import tool
from app.agent.tools.question_tools import get_question_by_id


@tool
def grade_answer(question_id: str, student_answer: int) -> dict:
    """학생의 답변을 채점한다.
    question_id: 문제 ID (예: 'q042')
    student_answer: 학생이 선택한 번호 (1~4)
    반환: correct(정오답), answer(정답번호), explanation(해설)
    """
    question = get_question_by_id(question_id)
    if not question:
        return {"error": f"문제 {question_id}를 찾을 수 없습니다."}

    correct = student_answer == question["answer"]
    return {
        "question_id": question_id,
        "student_answer": student_answer,
        "correct_answer": question["answer"],
        "correct": correct,
        "explanation": question.get("explanation", ""),
    }
