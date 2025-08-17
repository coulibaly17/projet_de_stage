from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any

from app.database import get_db
from app.models.user import User
from app.models.models import Course, course_student
from app.services.auth_service import get_current_active_user

# Constantes pour les messages d'erreur
STUDENT_ACCESS_DENIED = "Accès réservé aux étudiants"
COURSE_NOT_FOUND = "Cours non trouvé"
ALREADY_ENROLLED = "Vous êtes déjà inscrit à ce cours"
ENROLLMENT_ERROR = "Erreur lors de l'inscription au cours"

router = APIRouter()

@router.post("/student/enroll/{course_id}", response_model=Dict[str, Any])
async def enroll_in_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Inscrire un étudiant à un cours
    """
    if current_user.role != "etudiant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=STUDENT_ACCESS_DENIED
        )
    
    # Vérifier si le cours existe
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=COURSE_NOT_FOUND
        )
    
    # Vérifier si l'étudiant est déjà inscrit au cours
    existing_enrollment = db.query(course_student).filter(
        course_student.c.course_id == course_id,
        course_student.c.student_id == current_user.id
    ).first()
    
    if existing_enrollment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ALREADY_ENROLLED
        )
    
    try:
        # Ajouter l'étudiant au cours
        db.execute(
            course_student.insert().values(
                course_id=course_id,
                student_id=current_user.id,
                enrolled_at=func.now()
            )
        )
        db.commit()
        
        return {
            "success": True,
            "message": "Inscription au cours réussie",
            "course_id": course_id,
            "course_title": course.title
        }
        
    except Exception as e:
        db.rollback()
        error_detail = f"{ENROLLMENT_ERROR}: {str(e)}"
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_detail
        )
