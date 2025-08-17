# Import des services pour les rendre disponibles directement depuis le package services
from .auth_service import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
    get_current_active_user,
    authenticate_user,
    create_user
)

from .user_service import UserService
from .course_service import CourseService
from .recommendation_service_improved import RecommendationService
from . import recommendation_service_improved as recommendation_service

# Cette structure permet d'importer facilement tous les services avec:
# from app.services import UserService, CourseService, etc.
