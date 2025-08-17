from sqlalchemy import Boolean, Column, Integer, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from .discussion_participants import discussion_participants

# Pas d'import de modèles ici pour éviter les imports circulaires

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(50), nullable=True)
    last_name = Column(String(50), nullable=True)
    role = Column(Enum('etudiant', 'enseignant', 'admin', name='user_role'), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    
    # Propriétés calculées pour la compatibilité avec le code existant
    @property
    def full_name(self):
        return f"{self.first_name or ''} {self.last_name or ''}".strip()
    
    # La propriété is_active est maintenant une colonne de base de données
    
    @property
    def is_superuser(self):
        return self.role == 'admin'
    
    # Relations
    quiz_results = relationship("UserQuizResult", back_populates="user")
    taught_courses = relationship("Course", back_populates="instructor", foreign_keys="[Course.instructor_id]")
    enrolled_courses = relationship(
        "Course",
        secondary="course_student",
        back_populates="students",
        viewonly=True
    )
    completed_lessons = relationship(
        "LessonCompletion",
        back_populates="user",
        foreign_keys="[LessonCompletion.user_id]"
    )
    interactions = relationship(
        "UserInteraction",
        back_populates="user",
        foreign_keys="[UserInteraction.user_id]"
    )
    
    # Relations pour la messagerie
    discussions = relationship(
        'Discussion',
        secondary='discussion_participants',
        back_populates='participants',
        lazy='dynamic'
    )
    sent_messages = relationship(
        'Message',
        back_populates='sender',
        foreign_keys='Message.sender_id'
    )
    read_messages = relationship(
        'MessageRead',
        back_populates='user',
        foreign_keys='MessageRead.user_id'
    )
    
    def __repr__(self):
        return f"<User {self.email}>"
