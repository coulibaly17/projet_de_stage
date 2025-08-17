from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from .. import schemas, models
from ..database import get_db
from ..services import course_service, auth_service

router = APIRouter()

@router.get("/", response_model=List[schemas.Course])
def read_courses(
    skip: int = 0, 
    limit: int = 100,
    level: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """
    Récupère une liste de cours avec des filtres optionnels et la progression de l'utilisateur.
    """
    print(f"\n=== APPEL API COURSES ===")
    print(f"Utilisateur: {current_user.email} (ID: {current_user.id})")
    print(f"Paramètres: skip={skip}, limit={limit}, level={level}, tag={tag}, search={search}")
    
    courses = course_service.CourseService.get_courses(
        db=db, 
        skip=skip, 
        limit=limit, 
        level=level, 
        tag=tag,
        search=search,
        user_id=current_user.id
    )
    
    print(f"Nombre de cours trouvés: {len(courses) if courses else 0}")
    if courses:
        print(f"Premiers cours: {[{'id': c.id, 'title': c.title} for c in courses[:3]]}")
    else:
        print("Aucun cours trouvé dans la base de données")
    
    print(f"Type de retour: {type(courses)}")
    print(f"=== FIN APPEL API COURSES ===\n")
    
    return courses

@router.post("/", response_model=schemas.Course, status_code=status.HTTP_201_CREATED)
def create_course(
    course: schemas.CourseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """
    Crée un nouveau cours (réservé aux administrateurs).
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Action non autorisée"
        )
    return course_service.CourseService.create_course(db=db, course=course)

@router.get("/{course_id}", response_model=schemas.CourseWithProgress)
def read_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """
    Récupère un cours par son ID avec les informations de progression de l'utilisateur.
    """
    return course_service.CourseService.get_course_with_progress(
        db=db, 
        course_id=course_id, 
        user_id=current_user.id
    )

@router.put("/{course_id}", response_model=schemas.Course)
def update_course(
    course_id: int,
    course: schemas.CourseUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """
    Met à jour un cours existant (réservé aux administrateurs).
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Action non autorisée"
        )
    return course_service.CourseService.update_course(
        db=db, 
        course_id=course_id, 
        course_update=course
    )

@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """
    Supprime un cours (réservé aux administrateurs).
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Action non autorisée"
        )
    course_service.CourseService.delete_course(db=db, course_id=course_id)
    return {"ok": True}

@router.post("/{course_id}/enroll", status_code=status.HTTP_200_OK)
def enroll_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """
    Inscrit l'utilisateur actuel à un cours.
    """
    # Vérifie si le cours existe
    course = course_service.CourseService.get_course(db=db, course_id=course_id)
    
    # Vérifie si l'utilisateur est déjà inscrit
    existing_progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id,
        models.UserProgress.course_id == course_id
    ).first()
    
    if existing_progress:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous êtes déjà inscrit à ce cours"
        )
    
    # Crée une nouvelle entrée de progression
    db_progress = models.UserProgress(
        user_id=current_user.id,
        course_id=course_id,
        is_completed=False,
        completion_percentage=0.0
    )
    
    db.add(db_progress)
    db.commit()
    db.refresh(db_progress)
    
    return {"message": "Inscription au cours réussie"}

@router.post("/{course_id}/modules/", response_model=schemas.Module, status_code=status.HTTP_201_CREATED)
def create_module(
    course_id: int,
    module: schemas.ModuleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """
    Crée un nouveau module pour un cours (réservé aux administrateurs).
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Action non autorisée"
        )
    return course_service.CourseService.create_module(
        db=db, 
        course_id=course_id, 
        module=module
    )

@router.post("/modules/{module_id}/lessons/", response_model=schemas.Lesson, status_code=status.HTTP_201_CREATED)
def create_lesson(
    module_id: int,
    lesson: schemas.LessonCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """
    Crée une nouvelle leçon pour un module (réservé aux administrateurs).
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Action non autorisée"
        )
    return course_service.CourseService.create_lesson(
        db=db, 
        module_id=module_id, 
        lesson=lesson
    )

@router.post("/{course_id}/progress/", response_model=schemas.UserProgress)
def update_progress(
    course_id: int,
    progress_update: schemas.UserProgressUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """
    Met à jour la progression d'un utilisateur pour un cours.
    """
    # Vérifie si l'utilisateur est inscrit au cours
    db_progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == current_user.id,
        models.UserProgress.course_id == course_id
    ).first()
    
    if not db_progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vous n'êtes pas inscrit à ce cours"
        )
    
    # Met à jour la progression
    if progress_update.is_completed is not None:
        db_progress.is_completed = progress_update.is_completed
        if progress_update.is_completed:
            db_progress.completion_percentage = 100.0
    
    if progress_update.completion_percentage is not None:
        db_progress.completion_percentage = max(0.0, min(100.0, progress_update.completion_percentage))
    
    db.commit()
    db.refresh(db_progress)
    
    return db_progress
