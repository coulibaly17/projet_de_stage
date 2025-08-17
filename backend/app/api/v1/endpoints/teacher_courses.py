from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

from app.database import get_db
from app.models.user import User
from app.models.models import Course, Module, Lesson, Category
from app.services.auth_service import get_current_active_user

# Configurer le logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.info("Module teacher_courses.py chargé")

router = APIRouter()

@router.get("/", response_model=List[Dict[str, Any]])
async def get_teacher_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère la liste complète des cours enseignés par l'enseignant avec détails.
    """
    if current_user.role != "enseignant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux enseignants"
        )
    
    courses = db.query(Course).filter(
        Course.instructor_id == current_user.id
    ).all()
    
    logger.info(f"Utilisateur {current_user.email} (ID: {current_user.id}) - Nombre de cours trouvés: {len(courses)}")
    for course in courses:
        logger.info(f"Cours trouvé: ID={course.id}, Titre={course.title}, Status={course.status}")
    
    result = []
    for course in courses:
        # Récupérer la catégorie
        category = db.query(Category).filter(Category.id == course.category_id).first()
        
        # Compter les étudiants inscrits
        student_count = db.query(func.count(User.id)).join(
            Course.students
        ).filter(Course.id == course.id).scalar() or 0
        
        result.append({
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "short_description": course.short_description,
            "status": course.status,
            "price": course.price,
            "thumbnail_url": course.thumbnail_url,
            "image": course.thumbnail_url,  # Pour compatibilité
            "category_id": course.category_id,
            "category": {"id": category.id, "name": category.name} if category else None,
            "students_count": student_count,
            "created_at": course.created_at.isoformat() if course.created_at else None,
            "updated_at": course.updated_at.isoformat() if course.updated_at else None
        })
    
    return result

@router.get("/{course_id}", response_model=Dict[str, Any])
async def get_course_details(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère les détails d'un cours spécifique.
    """
    if current_user.role != "enseignant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux enseignants"
        )
    
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.instructor_id == current_user.id
    ).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cours non trouvé ou vous n'êtes pas l'enseignant de ce cours"
        )
    
    # Récupérer la catégorie
    category = db.query(Category).filter(Category.id == course.category_id).first()
    
    # Compter les étudiants inscrits
    student_count = db.query(func.count(User.id)).join(
        Course.students
    ).filter(Course.id == course.id).scalar() or 0
    
    return {
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "short_description": course.short_description,
        "status": course.status,
        "price": course.price,
        "thumbnail_url": course.thumbnail_url,
        "image": course.thumbnail_url,  # Pour compatibilité
        "category_id": course.category_id,
        "category": {"id": category.id, "name": category.name} if category else None,
        "students_count": student_count,
        "created_at": course.created_at.isoformat() if course.created_at else None,
        "updated_at": course.updated_at.isoformat() if course.updated_at else None
    }

@router.get("/{course_id}/modules", response_model=List[Dict[str, Any]])
async def get_course_modules(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère tous les modules d'un cours spécifique.
    """
    if current_user.role != "enseignant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux enseignants"
        )
    
    # Vérifier que le cours existe et appartient à l'enseignant
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.instructor_id == current_user.id
    ).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cours non trouvé ou vous n'êtes pas l'enseignant de ce cours"
        )
    
    # Récupérer les modules du cours
    modules = db.query(Module).filter(Module.course_id == course_id).order_by(Module.order_index).all()
    
    result = []
    for module in modules:
        result.append({
            "id": module.id,
            "title": module.title,
            "description": module.description,
            "order_index": module.order_index,
            "course_id": module.course_id
        })
    
    return result

@router.get("/{course_id}/modules/{module_id}/lessons", response_model=List[Dict[str, Any]])
async def get_module_lessons(
    course_id: int,
    module_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère toutes les leçons d'un module spécifique.
    """
    if current_user.role != "enseignant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux enseignants"
        )
    
    # Vérifier que le cours existe et appartient à l'enseignant
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.instructor_id == current_user.id
    ).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cours non trouvé ou vous n'êtes pas l'enseignant de ce cours"
        )
    
    # Vérifier que le module existe et appartient au cours
    module = db.query(Module).filter(
        Module.id == module_id,
        Module.course_id == course_id
    ).first()
    
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Module non trouvé ou n'appartient pas à ce cours"
        )
    
    # Récupérer toutes les leçons du module
    lessons = db.query(Lesson).filter(Lesson.module_id == module_id).order_by(Lesson.order_index).all()
    
    result = []
    for lesson in lessons:
        result.append({
            "id": lesson.id,
            "title": lesson.title,
            "description": lesson.description,
            "content": lesson.content,
            "duration": lesson.duration,
            "video_url": lesson.video_url,
            "is_free": lesson.is_free,
            "order_index": lesson.order_index,
            "module_id": lesson.module_id,
            "course_id": lesson.course_id
        })
    
    return result
