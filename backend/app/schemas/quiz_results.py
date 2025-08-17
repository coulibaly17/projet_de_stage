from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class QuizOptionResponse(BaseModel):
    id: int
    option_text: str
    is_correct: bool

class QuizQuestionResponse(BaseModel):
    id: int
    question_text: str
    question_type: str
    points: int
    options: List[QuizOptionResponse]

class UserAnswerResponse(BaseModel):
    question_id: int
    question_text: str
    selected_option_id: Optional[int] = None
    selected_option_text: Optional[str] = None
    answer_text: Optional[str] = None
    is_correct: bool
    correct_option_text: Optional[str] = None

class QuizResultDetailResponse(BaseModel):
    quiz_id: int
    quiz_title: str
    score: float
    passed: bool
    completed_at: datetime
    answers: List[UserAnswerResponse]
    total_questions: int
    correct_answers: int
    
class QuizResultSummaryResponse(BaseModel):
    id: int
    quiz_id: int
    quiz_title: str
    score: float
    passed: bool
    completed_at: datetime
    total_questions: int
    correct_answers: int
    course_id: int
    course_title: str
    
class QuizHistoryResponse(BaseModel):
    results: List[QuizResultSummaryResponse]
    total_quizzes: int
    average_score: float
    passed_quizzes: int
