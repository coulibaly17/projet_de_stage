from sqlalchemy import Column, Integer, ForeignKey, DateTime, Float, String, Boolean, and_
from sqlalchemy.orm import relationship, foreign
from sqlalchemy.sql import func
from ..database import Base
from .user_quiz_answers import UserQuizAnswer

class UserProgress(Base):
    __tablename__ = "user_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=True)
    
    # État de progression
    is_completed = Column(Boolean, default=False)
    completion_percentage = Column(Float, default=0.0)  # 0.0 à 100.0
    last_accessed = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Métadonnées
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<UserProgress user_id={self.user_id} course_id={self.course_id}>"

class UserQuizResult(Base):
    __tablename__ = "user_quiz_results"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    score = Column(Float, nullable=False)  # Score en pourcentage
    passed = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    user = relationship("User", back_populates="quiz_results")
    quiz = relationship("Quiz", back_populates="results")
    answers = relationship("UserQuizAnswer", primaryjoin="and_(foreign(UserQuizResult.user_id)==UserQuizAnswer.user_id, foreign(UserQuizResult.quiz_id)==UserQuizAnswer.quiz_id)")

    
    def __repr__(self):
        return f"<UserQuizResult user_id={self.user_id} quiz_id={self.quiz_id} score={self.score}>"

class UserRecommendation(Base):
    __tablename__ = "user_recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    
    # Score de recommandation (plus le score est élevé, plus la recommandation est pertinente)
    score = Column(Float, nullable=False)
    
    # Raison de la recommandation (basée sur les compétences, le comportement, etc.)
    reason = Column(String(255), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<UserRecommendation user_id={self.user_id} course_id={self.course_id} score={self.score}>"
