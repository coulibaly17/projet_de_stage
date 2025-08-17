from sqlalchemy import Column, Integer, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class UserQuizAnswer(Base):
    __tablename__ = "user_quiz_answers"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("quiz_questions.id"), nullable=False)
    option_id = Column(Integer, ForeignKey("quiz_options.id"), nullable=True)  # Peut être NULL pour les réponses textuelles
    answer_text = Column(Text, nullable=True)  # Pour les réponses textuelles
    is_correct = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    user = relationship("User", backref="quiz_answers")
    quiz = relationship("Quiz")
    question = relationship("QuizQuestion")
    option = relationship("QuizOption", foreign_keys=[option_id])
    
    def __repr__(self):
        return f"<UserQuizAnswer user_id={self.user_id} quiz_id={self.quiz_id} question_id={self.question_id}>"
