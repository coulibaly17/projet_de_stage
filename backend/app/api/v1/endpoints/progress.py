from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.models import Course, Lesson, Module
from app.schemas.progress import (
    ProgressUpdate, 
    UserProgressResponse,
    LessonProgress,
    ModuleProgress
)
from app.services.progress_service import ProgressService
from app.services.auth_service import get_current_active_user

router = APIRouter()

@router.get("/courses/{course_id}/progress", response_model=UserProgressResponse)
async def get_course_progress(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère les détails de progression d'un étudiant pour un cours spécifique.
    Inclut la progression par module et par leçon.
    """
    progress_service = ProgressService(db)
    try:
        return progress_service.get_course_progress_details(current_user.id, course_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Une erreur est survenue lors de la récupération de la progression: {str(e)}"
        )

@router.put("/courses/{course_id}/lessons/{lesson_id}/progress")
async def update_lesson_progress(
    course_id: int,
    lesson_id: int,
    progress_data: ProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Met à jour la progression d'une leçon pour un étudiant.
    
    - **is_completed**: Marque la leçon comme terminée (true) ou non terminée (false)
    - **completion_percentage**: Pourcentage de complétion de la leçon (0-100)
    """
    progress_service = ProgressService(db)
    try:
        progress = progress_service.update_lesson_progress(
            user_id=current_user.id,
            course_id=course_id,
            lesson_id=lesson_id,
            progress_data=progress_data
        )
        return {"message": "Progression mise à jour avec succès", "progress": progress}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Une erreur est survenue lors de la mise à jour de la progression: {str(e)}"
        )

@router.get("/my-progress", response_model=List[dict])
async def get_my_progress(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère un résumé de la progression de l'étudiant dans tous ses cours.
    """
    progress_service = ProgressService(db)
    
    try:
        # Récupérer tous les cours auxquels l'étudiant est inscrit
        enrolled_courses = db.query(Course).join(
            Course.students
        ).filter(
            User.id == current_user.id
        ).offset(skip).limit(limit).all()
        
        result = []
        for course in enrolled_courses:
            # Pour chaque cours, obtenir les détails de progression
            try:
                progress = progress_service.get_course_progress_details(current_user.id, course.id)
                
                # Compter le nombre total de leçons dans le cours
                total_lessons = sum(len(module.lessons) for module in progress.modules)
                
                # Compter le nombre de leçons complétées
                completed_lessons = sum(
                    1 for module in progress.modules 
                    for lesson in module.lessons 
                    if lesson.is_completed
                )
                
                result.append({
                    "course_id": course.id,
                    "course_title": course.title,
                    "thumbnail_url": course.thumbnail_url,
                    "progress_percentage": progress.progress_percentage,
                    "is_completed": progress.is_completed,
                    "completed_lessons": completed_lessons,
                    "total_lessons": total_lessons,
                    "last_accessed": None  # À implémenter si nécessaire
                })
            except Exception as e:
                # Si une erreur se produit pour un cours, passer au suivant
                print(f"Erreur lors du traitement du cours {course.id}: {str(e)}")
                continue
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Une erreur est survenue lors de la récupération de la progression: {str(e)}"
        )
