from typing import Generic, TypeVar, List, Optional
from pydantic import BaseModel, Field
from pydantic.generics import GenericModel

# Type générique pour la réponse paginée
T = TypeVar('T')

class PaginatedResponse(GenericModel, Generic[T]):
    """
    Schéma de réponse paginée standard pour les listes.
    
    Attributes:
        items: Liste des éléments de la page courante
        total: Nombre total d'éléments
        page: Numéro de la page courante
        limit: Nombre d'éléments par page
        pages: Nombre total de pages
    """
    items: List[T] = Field(..., description="Liste des éléments de la page courante")
    total: int = Field(..., ge=0, description="Nombre total d'éléments")
    page: int = Field(1, ge=1, description="Numéro de la page courante")
    limit: int = Field(20, ge=1, le=100, description="Nombre d'éléments par page")
    pages: int = Field(..., ge=0, description="Nombre total de pages")
    
    class Config:
        json_encoders = {
            'datetime': lambda v: v.isoformat() if v else None
        }

# Import des schémas pour les rendre disponibles directement depuis le package schemas
from .user import User, UserCreate, UserInDB, UserUpdate, UserLogin, Token, TokenData
from .course import (
    Course, CourseCreate, CourseUpdate, CourseWithProgress,
    Module, ModuleCreate,
    Lesson, LessonCreate,
    Tag, TagCreate
)
from .progress import (
    UserProgress, UserProgressCreate, UserProgressUpdate,
    UserQuizResult, UserQuizResultCreate,
    UserRecommendation, UserRecommendationCreate,
    LearningStats
)
from .interaction import InteractionBase, InteractionCreate, UserInteraction, UserInteractionStats

# Cette structure permet d'importer facilement tous les schémas avec:
# from app.schemas import User, Course, etc.

# Ajout de tous les schémas pour faciliter l'import
__all__ = [
    # Modèles de base
    'PaginatedResponse',
    
    # Utilisateurs et authentification
    'User', 'UserCreate', 'UserInDB', 'UserUpdate', 'UserLogin', 'Token', 'TokenData',
    
    # Cours et contenu
    'Course', 'CourseCreate', 'CourseUpdate', 'CourseWithProgress',
    'Module', 'ModuleCreate',
    'Lesson', 'LessonCreate',
    'Tag', 'TagCreate',
    
    # Progrès et recommandations
    'UserProgress', 'UserProgressCreate', 'UserProgressUpdate',
    'UserQuizResult', 'UserQuizResultCreate',
    'UserRecommendation', 'UserRecommendationCreate',
    'LearningStats',
    
    # Interactions
    'InteractionBase', 'InteractionCreate', 'UserInteraction', 'UserInteractionStats'
]
