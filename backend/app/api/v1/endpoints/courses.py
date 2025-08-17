from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List, Dict, Any, Optional
from datetime import datetime
import re

from app.database import get_db
from app.models.user import User
from app.models.models import Course, Module, Lesson, Category, course_student
from app.models.progress import UserProgress
from app.services.auth_service import get_current_active_user

router = APIRouter()
@router.get("/admin/courses", response_model=List[Dict[str, Any]])
async def get_all_courses_admin(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère tous les cours (uniquement pour les administrateurs)
    """
    # Vérifier si l'utilisateur est administrateur
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé. Réservé aux administrateurs."
        )
    
    # Récupérer tous les cours avec pagination
    courses = db.query(Course).offset(skip).limit(limit).all()
    
    # Formater la réponse
    result = []
    for course in courses:
        # Récupérer la catégorie
        category = db.query(Category).filter(Category.id == course.category_id).first()
        
        # Compter les étudiants inscrits
        student_count = db.query(func.count(User.id)).join(
            Course.students
        ).filter(Course.id == course.id).scalar() or 0
        
        # Récupérer l'instructeur
        instructor = db.query(User).filter(User.id == course.instructor_id).first()
        
        # Formater les données du cours
        course_data = {
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "short_description": getattr(course, 'short_description', ''),
            "status": getattr(course, 'status', 'draft'),
            "price": float(course.price) if course.price else 0.0,
            "thumbnail_url": getattr(course, 'thumbnail_url', ''),
            "image": getattr(course, 'thumbnail_url', ''),  # Pour compatibilité
            "category_id": course.category_id,
            "category": {"id": category.id, "name": category.name} if category else None,
            "instructor_id": course.instructor_id,
            "instructor": {
                "id": instructor.id,
                "first_name": instructor.first_name,
                "last_name": instructor.last_name,
                "email": instructor.email
            } if instructor else None,
            "student_count": student_count,
            "created_at": course.created_at.isoformat() if course.created_at else None,
            "updated_at": course.updated_at.isoformat() if course.updated_at else None
        }
        result.append(course_data)
    
    return result

@router.get("/categories", response_model=List[Dict[str, Any]])
async def get_categories(
    db: Session = Depends(get_db)
):
    """
    Récupère toutes les catégories disponibles.
    """
    categories = db.query(Category).all()
    
    return [
        {
            "id": category.id,
            "name": category.name,
            "description": category.description
        }
        for category in categories
    ]

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
    
    result = []
    for course in courses:
        # Récupérer la catégorie
        category = db.query(Category).filter(Category.id == course.category_id).first()
        
        # Compter les étudiants inscrits
        student_count = db.query(func.count(User.id)).join(
            Course.students
        ).filter(Course.id == course.id).scalar() or 0
        
        # Récupérer les étudiants
        students = [{
            "id": student.id,
            "first_name": student.first_name,
            "last_name": student.last_name,
            "email": student.email
        } for student in course.students]
        
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
            "student_count": student_count,
            "students": students,
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
    Récupère les détails d'un cours spécifique avec ses modules et leçons.
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
    
    # Récupérer les modules avec leurs leçons
    modules = db.query(Module).filter(Module.course_id == course.id).order_by(Module.order_index).all()
    
    modules_data = []
    for module in modules:
        # Récupérer les leçons du module
        lessons = db.query(Lesson).filter(Lesson.module_id == module.id).order_by(Lesson.order).all()
        
        lessons_data = [{
            "id": lesson.id,
            "title": lesson.title,
            "description": lesson.description,
            "content": lesson.content,
            "type": lesson.type,
            "duration_minutes": lesson.duration_minutes,
            "is_free": lesson.is_free,
            "order": lesson.order
        } for lesson in lessons]
        
        modules_data.append({
            "id": module.id,
            "title": module.title,
            "description": module.description,
            "order_index": module.order_index,  # Utiliser order_index au lieu de order
            "order": module.order_index,  # Garder order pour compatibilité avec le frontend
            "lessons": lessons_data,
            "lesson_count": len(lessons_data)
        })
    
    # Compter les étudiants inscrits
    student_count = db.query(func.count(User.id)).join(
        Course.students
    ).filter(Course.id == course.id).scalar() or 0
    
    # Récupérer les étudiants
    students = [{
        "id": student.id,
        "first_name": student.first_name,
        "last_name": student.last_name,
        "email": student.email
    } for student in course.students]
    
    result = {
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
        "modules": modules_data,
        "module_count": len(modules_data),
        "student_count": student_count,
        "students": students,
        "created_at": course.created_at.isoformat() if course.created_at else None,
        "updated_at": course.updated_at.isoformat() if course.updated_at else None
    }
    
    return result

@router.post("/create", response_model=Dict[str, Any])
async def create_course(
    course_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Crée un nouveau cours pour l'enseignant.
    """
    if current_user.role != "enseignant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux enseignants"
        )
    
    # Générer un slug à partir du titre
    title = course_data.get("title", "")
    slug = re.sub(r'[^a-zA-Z0-9\s-]', '', title.lower())
    slug = re.sub(r'\s+', '-', slug.strip())
    slug = slug[:200]  # Limiter à 200 caractères
    
    # Vérifier l'unicité du slug
    base_slug = slug
    counter = 1
    while db.query(Course).filter(Course.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    # Créer le nouveau cours
    new_course = Course(
        title=course_data.get("title"),
        slug=slug,
        description=course_data.get("description"),
        short_description=course_data.get("short_description"),
        status=course_data.get("status", "draft"),
        level=course_data.get("level", "beginner"),
        category_id=course_data.get("category_id"),
        instructor_id=current_user.id,
        thumbnail_url=course_data.get("thumbnail_url") or course_data.get("image"),
        price=course_data.get("price", 0),
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    
    return {
        "id": new_course.id,
        "title": new_course.title,
        "message": "Cours créé avec succès"
    }

@router.post("/{course_id}/modules", response_model=Dict[str, Any])
async def create_module(
    course_id: int,
    module_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Crée un nouveau module pour un cours spécifique.
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
    
    # Créer le nouveau module
    new_module = Module(
        course_id=course_id,
        title=module_data.get("title"),
        description=module_data.get("description", ""),
        order_index=module_data.get("order", 1)  # Frontend envoie "order", backend utilise "order_index"
    )
    
    db.add(new_module)
    db.commit()
    db.refresh(new_module)
    
    return {
        "id": new_module.id,
        "title": new_module.title,
        "message": "Module créé avec succès"
    }

@router.post("/{course_id}/modules/{module_id}/lessons", response_model=Dict[str, Any])
async def create_lesson(
    course_id: int,
    module_id: int,
    lesson_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Crée une nouvelle leçon pour un module spécifique.
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
    
    # Créer la nouvelle leçon
    new_lesson = Lesson(
        module_id=module_id,
        course_id=course_id,
        title=lesson_data.get("title"),
        description=lesson_data.get("description", ""),
        content=lesson_data.get("content", ""),
        video_url=lesson_data.get("video_url"),
        duration=lesson_data.get("duration", 0),  # Frontend envoie "duration"
        is_free=lesson_data.get("is_free", False),
        order_index=lesson_data.get("order_index", 1)  # Frontend envoie "order_index"
    )
    
    db.add(new_lesson)
    db.commit()
    db.refresh(new_lesson)
    
    return {
        "id": new_lesson.id,
        "title": new_lesson.title,
        "message": "Leçon créée avec succès"
    }

@router.get("/student/enrolled", response_model=List[Dict[str, Any]])
async def get_student_enrolled_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère la liste des cours auxquels l'étudiant est inscrit.
    Utilise la table course_student pour filtrer les cours.
    """
    if current_user.role != "etudiant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux étudiants"
        )
    
    # Récupérer les cours via la relation many-to-many
    enrolled_courses = db.query(Course).join(
        course_student, Course.id == course_student.c.course_id
    ).filter(
        course_student.c.student_id == current_user.id
    ).all()
    
    result = []
    for course in enrolled_courses:
        # Récupérer la catégorie
        category = db.query(Category).filter(Category.id == course.category_id).first()
        
        # Récupérer les modules avec leurs leçons
        modules = db.query(Module).filter(Module.course_id == course.id).order_by(Module.order_index).all()
        modules_data = []
        
        for module in modules:
            lessons = db.query(Lesson).filter(Lesson.module_id == module.id).order_by(Lesson.order_index).all()
            lessons_data = [{
                "id": lesson.id,
                "title": lesson.title,
                "description": lesson.description,
                "content": lesson.content,
                "video_url": lesson.video_url,
                "duration": lesson.duration,
                "order": lesson.order_index,  # Renommé pour cohérence frontend
                "is_free": lesson.is_free
            } for lesson in lessons]
            
            modules_data.append({
                "id": module.id,
                "title": module.title,
                "description": module.description,
                "order": module.order_index,  # Renommé pour cohérence frontend
                "lessons": lessons_data
            })
        
        # Calculer la progression réelle depuis la base de données
        total_lessons = sum(len(module_data["lessons"]) for module_data in modules_data)
        
        # Récupérer la progression depuis la table user_progress
        user_progress = db.query(UserProgress).filter(
            UserProgress.user_id == current_user.id,
            UserProgress.course_id == course.id
        ).first()
        
        if user_progress:
            progress = user_progress.completion_percentage
        else:
            progress = 0  # Pas de progression enregistrée
        
        result.append({
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "short_description": course.short_description,
            "status": course.status,
            "price": course.price,
            "thumbnail_url": course.thumbnail_url,
            "image": course.thumbnail_url,  # Pour compatibilité
            "level": course.level,
            "category_id": course.category_id,
            "category": {"id": category.id, "name": category.name} if category else None,
            "instructor_id": course.instructor_id,
            "instructor": {
                "id": course.instructor.id,
                "first_name": course.instructor.first_name,
                "last_name": course.instructor.last_name,
                "email": course.instructor.email
            } if course.instructor else None,
            "modules": modules_data,
            "created_at": course.created_at.isoformat() if course.created_at else None,
            "updated_at": course.updated_at.isoformat() if course.updated_at else None,
            # Nouvelles données pour l'affichage des boutons
            "is_enrolled": True,  # Toujours vrai car on récupère les cours inscrits
            "progress": progress,  # Progression calculée
            "total_lessons": total_lessons,
            "difficulty_level": "intermediate",  # Valeur par défaut - peut être améliorée
            "students_count": 0,  # Peut être calculé si nécessaire
            "average_rating": 4.5,  # Valeur par défaut - peut être calculée
            "tags": []  # Peut être ajouté si nécessaire
        })
    
    return result
