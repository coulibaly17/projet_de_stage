from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from . import Base

class Quiz(Base):
    __tablename__ = "quizzes"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    passing_score = Column(Integer, default=70)  # Score de passage en pourcentage
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    results = relationship("UserQuizResult", back_populates="quiz")
    
    def __repr__(self):
        return f"<Quiz id={self.id} title='{self.title}'>"

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), nullable=False)  # 'multiple_choice', 'true_false', 'short_answer'
    points = Column(Integer, default=1)
    # Le champ order a été supprimé car il n'existe pas dans la base de données
    
    # Relations
    quiz = relationship("Quiz", back_populates="questions")
    options = relationship("QuizOption", back_populates="question", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<QuizQuestion id={self.id} text='{self.question_text[:50]}...'>"

class QuizOption(Base):
    __tablename__ = "quiz_options"
    
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("quiz_questions.id"), nullable=False)
    option_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False)
    
    # Relations
    question = relationship("QuizQuestion", back_populates="options")
    
    def __repr__(self):
        return f"<QuizOption id={self.id} is_correct={self.is_correct}>"
