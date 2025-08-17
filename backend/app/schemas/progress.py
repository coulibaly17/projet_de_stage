from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class UserProgressBase(BaseModel):
    course_id: int
    lesson_id: Optional[int] = None
    is_completed: bool = False
    completion_percentage: float = 0.0

class UserProgressCreate(UserProgressBase):
    pass

class UserProgressUpdate(BaseModel):
    is_completed: Optional[bool] = None
    completion_percentage: Optional[float] = None

class UserProgress(UserProgressBase):
    id: int
    user_id: int
    last_accessed: datetime
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class UserQuizResultBase(BaseModel):
    quiz_id: int
    score: float
    passed: bool = False

class UserQuizResultCreate(UserQuizResultBase):
    pass

class UserQuizResult(UserQuizResultBase):
    id: int
    user_id: int
    completed_at: datetime
    
    class Config:
        from_attributes = True

class UserRecommendationBase(BaseModel):
    course_id: int
    score: float
    reason: Optional[str] = None

class UserRecommendationCreate(UserRecommendationBase):
    pass

class UserRecommendation(UserRecommendationBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ProgressUpdate(BaseModel):
    """Modèle pour la mise à jour de la progression d'une leçon"""
    is_completed: Optional[bool] = Field(
        None,
        description="Indique si la leçon est marquée comme terminée"
    )
    completion_percentage: Optional[float] = Field(
        None,
        ge=0,
        le=100,
        description="Pourcentage de complétion de la leçon (0-100)"
    )

class LessonProgress(BaseModel):
    """Modèle pour la progression d'une leçon"""
    lesson_id: int
    lesson_title: str
    order_index: int
    is_completed: bool
    completion_percentage: float
    last_accessed: Optional[datetime] = None

class ModuleProgress(BaseModel):
    """Modèle pour la progression d'un module"""
    module_id: int
    module_title: str
    order_index: int
    lessons: List[LessonProgress] = []
    completed_lessons: int = 0
    total_lessons: int = 0

class UserProgressResponse(BaseModel):
    """Réponse complète de la progression d'un utilisateur pour un cours"""
    course_id: int
    course_title: str
    progress_percentage: float
    is_completed: bool
    modules: List[ModuleProgress] = []


class CourseProgress(BaseModel):
    """Modèle pour la progression d'un cours"""
    course_id: int
    course_title: str
    progress_percentage: float
    is_completed: bool
    last_accessed: Optional[datetime] = None
    completed_modules: int = 0
    total_modules: int = 0
    completed_lessons: int = 0
    total_lessons: int = 0
    next_lesson: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True

class LearningStats(BaseModel):
    """Statistiques d'apprentissage globales"""
    total_courses: int = 0
    completed_courses: int = 0
    in_progress_courses: int = 0
    total_lessons: int = 0
    completed_lessons: int = 0
    total_study_time: int = 0  # en minutes
    
    class Config:
        from_attributes = True
