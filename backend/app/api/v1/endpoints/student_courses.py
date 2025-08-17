from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List, Dict, Any

from app.database import get_db
from app.models.user import User
from app.models.models import Course, Category, Lesson, Module, course_student
from app.services.auth_service import get_current_active_user

router = APIRouter()

from pydantic import BaseModel

class PaginationParams(BaseModel):
    skip: int = 0
    limit: int = 100

@router.post("/unenrolled", response_model=List[Dict[str, Any]])
async def get_student_unenrolled_courses(
    pagination: PaginationParams = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère la liste des cours publiés auxquels l'étudiant n'est PAS inscrit.
    """
    print("\n" + "="*80)
    print("=== DÉBUT REQUÊTE /student/courses/unenrolled ===")
    print("="*80)
    
    # Log des paramètres de la requête
    print(f"\n[REQUÊTE] Paramètres reçus: {pagination}")
    
    if pagination is None:
        pagination = PaginationParams()
        
    skip = pagination.skip
    limit = pagination.limit
    
    # Log des informations utilisateur
    print(f"\n[UTILISATEUR]")
    print(f"- ID: {current_user.id}")
    print(f"- Email: {current_user.email}")
    print(f"- Rôle: {current_user.role}")
    
    # Log des paramètres de pagination
    print(f"\n[PAGINATION]")
    print(f"- Skip: {skip} (type: {type(skip)})")
    print(f"- Limit: {limit} (type: {type(limit)})")
    
    # Vérification du type des paramètres
    if not isinstance(skip, int) or not isinstance(limit, int):
        print("\n[ERREUR] Les paramètres ne sont pas des entiers!")
        print(f"- Type de skip: {type(skip)}")
        print(f"- Type de limit: {type(limit)}")
    else:
        print("\n[VALIDATION] Les paramètres sont bien des entiers")
    
    # Vérifier les limites
    if skip < 0 or limit < 1 or limit > 100:
        print(f"Valeurs de paramètres invalides: skip={skip}, limit={limit}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Les paramètres doivent respecter: skip >= 0, 1 <= limit <= 100"
        )
        
    # Afficher les informations sur l'utilisateur actuel
    print(f"Utilisateur actuel - ID: {current_user.id}, Email: {current_user.email}, Rôle: {current_user.role}")
    print(f"Attributs de l'utilisateur: {dir(current_user)}")
    if hasattr(current_user, '__dict__'):
        print(f"Dictionnaire de l'utilisateur: {current_user.__dict__}")
    
    # Vérifier si l'utilisateur est un étudiant
    print(f"Rôle de l'utilisateur: {current_user.role}")
    if current_user.role != "etudiant":
        print("ERREUR: L'utilisateur n'est pas un étudiant")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux étudiants"
        )
        
    print("Vérification du rôle utilisateur: OK")
    
    # Récupérer les IDs des cours auxquels l'étudiant est déjà inscrit
    print("\n[RÉCUPÉRATION] Recherche des cours déjà suivis par l'étudiant...")
    enrolled_course_ids = db.query(course_student.c.course_id).filter(
        course_student.c.student_id == current_user.id
    ).subquery()
    
    print(f"- Nombre de cours déjà suivis: {db.query(enrolled_course_ids).count()}")
    
    # Récupérer les cours non inscrits (publiés uniquement)
    print("\n[RÉCUPÉRATION] Recherche des cours non suivis...")
    unenrolled_courses = db.query(Course).filter(
        Course.id.notin_(enrolled_course_ids),
        Course.status == "PUBLISHED"  # Seulement les cours publiés
    ).offset(skip).limit(limit).all()
    
    print(f"- Nombre de cours non suivis trouvés: {len(unenrolled_courses)}")
    print(f"- Requête SQL: {str(db.query(Course).filter(Course.id.notin_(enrolled_course_ids), Course.status == 'PUBLISHED').statement)}")
    
    result = []
    print("\n[TRAITEMENT] Préparation des données des cours...")
    
    for index, course in enumerate(unenrolled_courses, 1):
        print(f"\nCours #{index} (ID: {course.id}): {course.title}")
        
        # Récupérer la catégorie
        category = db.query(Category).filter(Category.id == course.category_id).first()
        print(f"- Catégorie: {category.name if category else 'Aucune'}")
        
        # Compter les étudiants inscrits
        student_count = db.query(func.count(User.id)).join(
            Course.students
        ).filter(Course.id == course.id).scalar() or 0
        print(f"- Nombre d'étudiants inscrits: {student_count}")
        
        # Log des données du cours
        print(f"- Statut: {course.status}")
        print(f"- Prix: {course.price}")
        print(f"- Date de création: {course.created_at}")
        
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
            "updated_at": course.updated_at.isoformat() if course.updated_at else None,
            "is_enrolled": False,  # Car ce sont les cours non inscrits
            "progress": 0,  # Progression à 0 car non inscrit
            "difficulty_level": course.level if hasattr(course, 'level') else "intermediate",
            "total_lessons": db.query(Lesson).join(Module).filter(Module.course_id == course.id).count(),
            "average_rating": 4.5,  # Peut être calculé si nécessaire
            "tags": []  # Pour compatibilité avec le frontend
        }
        result.append(course_data)
    
    print("\n" + "="*80)
    print(f"=== FIN REQUÊTE /student/courses/unenrolled - {len(result)} cours retournés ===")
    print("="*80 + "\n")
    
    return result
