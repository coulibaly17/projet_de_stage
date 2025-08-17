# Import de la base de données
from ..database import Base

# Import des modèles principaux
from .user import User
from .quiz import Quiz, QuizQuestion, QuizOption
from .progress import UserProgress, UserQuizResult, UserRecommendation
from .interaction import UserInteraction
from .models import (
    Course, Lesson, Tag, course_tags, Category, Resource, 
    LessonCompletion, Module, course_student, 
    course_prerequisites, CourseStatus
)

# Import des modèles de messagerie
from .messaging import Discussion, Message, MessageRead
from .discussion_participants import discussion_participants

# Pour faciliter les imports
__all__ = [
    'Base',
    # User
    'User',
    
    # Course et Lesson (depuis models.py)
    'Course', 'Lesson',
    
    # Quiz
    'Quiz', 'QuizQuestion', 'QuizOption',
    
    # Progress
    'UserProgress', 'UserQuizResult', 'UserRecommendation',
    
    # Interaction
    'UserInteraction',
    
    # Messagerie
    'Discussion', 'Message', 'MessageRead', 'discussion_participants',
    
    # Autres modèles
    'Tag', 'course_tags', 'Category', 'Resource', 'LessonCompletion',
    'Module', 'course_student', 'course_prerequisites', 'CourseStatus'
]

# Configuration des relations après l'import de tous les modèles
from sqlalchemy.orm import configure_mappers
configure_mappers()
