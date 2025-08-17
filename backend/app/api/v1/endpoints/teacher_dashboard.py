from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User
from app.models.progress import UserProgress, UserQuizResult, UserRecommendation
from app.models.quiz import Quiz
from app.models.models import Course, Lesson
from app.services.auth_service import get_current_active_user
from app.schemas.teacher import (
    DashboardStats, 
    StudentProgressResponse, 
    RecommendationResponse,
    CourseCompletionResponse,
    ActivityResponse,
    TaskResponse
)

router = APIRouter()

@router.get("/students", response_model=List[Dict[str, Any]])
async def get_teacher_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère tous les étudiants inscrits aux cours de l'enseignant.
    """
    if current_user.role != "enseignant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux enseignants"
        )
    
    # Récupérer les cours enseignés par l'utilisateur
    courses = db.query(Course).filter(Course.instructor_id == current_user.id).all()
    course_ids = [course.id for course in courses]
    
    # Si aucun cours trouvé, retourner une liste vide
    if not course_ids:
        return []
    
    # Récupérer tous les étudiants inscrits à ces cours
    students = db.query(User).join(
        Course.students
    ).filter(
        Course.id.in_(course_ids),
        User.role == "etudiant"
    ).distinct().all()
    
    # Formater les résultats
    result = []
    for student in students:
        # Calculer le nombre de cours auxquels l'étudiant est inscrit parmi les cours de l'enseignant
        student_courses = db.query(Course).join(
            Course.students
        ).filter(
            Course.id.in_(course_ids),
            User.id == student.id
        ).all()
        
        # Calculer la progression moyenne de l'étudiant
        progress = db.query(func.avg(UserProgress.completion_percentage)).filter(
            UserProgress.user_id == student.id,
            UserProgress.course_id.in_(course_ids)
        ).scalar() or 0
        
        # Trouver la dernière activité de l'étudiant
        last_activity = db.query(UserProgress.last_accessed).filter(
            UserProgress.user_id == student.id,
            UserProgress.course_id.in_(course_ids)
        ).order_by(UserProgress.last_accessed.desc()).first()
        
        # Déterminer si l'étudiant est actif (activité dans les 30 derniers jours)
        is_active = False
        last_active_date = None
        if last_activity:
            last_active_date = last_activity[0].isoformat()
            is_active = (datetime.now() - last_activity[0]) <= timedelta(days=30)
        
        result.append({
            "id": str(student.id),
            "firstName": student.first_name,
            "lastName": student.last_name,
            "email": student.email,
            "courseCount": len(student_courses),
            "lastActive": last_active_date,
            "progress": round(progress),
            "status": "active" if is_active else "inactive"
        })
    
    return result

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère les statistiques générales pour le tableau de bord de l'enseignant.
    """
    if current_user.role != "enseignant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux enseignants"
        )
    
    # Récupérer les cours enseignés par l'utilisateur
    courses = db.query(Course).filter(Course.instructor_id == current_user.id).all()
    course_ids = [course.id for course in courses]
    
    # Compter les étudiants uniques inscrits à ces cours
    student_count = db.query(User).join(
        Course.students
    ).filter(
        Course.id.in_(course_ids)
    ).distinct().count()
    
    # Compter les devoirs à corriger
    assignments_to_grade = db.query(UserQuizResult).join(
        Quiz
    ).join(
        Lesson, Quiz.lesson_id == Lesson.id
    ).filter(
        Lesson.course_id.in_(course_ids),
        UserQuizResult.passed == False  # On suppose que les quiz non passés sont à corriger
    ).count()
    
    # Calculer l'engagement moyen (pourcentage moyen de progression)
    engagement = db.query(UserProgress).filter(
        UserProgress.course_id.in_(course_ids)
    ).with_entities(
        func.avg(UserProgress.completion_percentage)
    ).scalar() or 0
    
    return {
        "students": student_count,
        "courses": len(courses),
        "assignments": assignments_to_grade,
        "engagement": round(engagement)
    }

@router.get("/student-progress", response_model=List[StudentProgressResponse])
async def get_student_progress(
    course_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère la progression des étudiants pour les cours enseignés par l'enseignant.
    """
    if current_user.role != "enseignant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux enseignants"
        )
    
    # Récupérer les cours enseignés par l'utilisateur
    courses_query = db.query(Course).filter(Course.instructor_id == current_user.id)
    
    # Filtrer par cours si spécifié
    if course_id:
        courses_query = courses_query.filter(Course.id == course_id)
    
    courses = courses_query.all()
    course_ids = [course.id for course in courses]
    
    # Si aucun cours trouvé, retourner une liste vide
    if not course_ids:
        return []
    
    # Récupérer tous les étudiants inscrits à ces cours avec leur progression
    students_with_progress = db.query(
        User,
        Course.title.label("course_title"),
        Course.id.label("course_id"),
        func.coalesce(UserProgress.completion_percentage, 0).label("completion_percentage"),
        func.coalesce(UserProgress.last_accessed, datetime.now()).label("last_accessed")
    ).join(
        Course.students
    ).outerjoin(
        UserProgress, 
        (UserProgress.user_id == User.id) & (UserProgress.course_id == Course.id)
    ).filter(
        Course.id.in_(course_ids)
    ).all()
    
    # Formater les résultats
    response = []
    for user, course_title, course_id, progress, last_accessed in students_with_progress:
        # Calculer le temps écoulé depuis la dernière activité
        # S'assurer que last_accessed est un objet datetime
        if isinstance(last_accessed, str):
            try:
                last_accessed = datetime.fromisoformat(last_accessed.replace('Z', '+00:00'))
            except (ValueError, TypeError):
                # En cas d'erreur de conversion, utiliser l'heure actuelle
                last_accessed = datetime.now()
        
        time_diff = datetime.now() - last_accessed
        if time_diff < timedelta(hours=1):
            last_activity = f"{time_diff.seconds // 60} minutes ago"
        elif time_diff < timedelta(days=1):
            last_activity = f"{time_diff.seconds // 3600} heures ago"
        else:
            last_activity = f"{time_diff.days} jours ago"
            
        response.append({
            "id": user.id,
            "name": user.full_name or f"{user.first_name} {user.last_name}",
            "email": user.email,
            "avatar": f"https://randomuser.me/api/portraits/{'women' if user.id % 2 == 0 else 'men'}/{user.id % 70}.jpg",
            "course": course_title,
            "progress": round(progress),
            "lastActivity": last_activity
        })
    
    return response

@router.get("/courses", response_model=List[Dict[str, Any]])
async def get_teacher_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère la liste des cours enseignés par l'enseignant.
    """
    if current_user.role != "enseignant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux enseignants"
        )
    
    courses = db.query(Course).filter(
        Course.instructor_id == current_user.id
    ).all()
    
    return [{"id": course.id, "name": course.title} for course in courses]

@router.get("/recommendations", response_model=List[RecommendationResponse])
async def get_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère les recommandations IA pour l'enseignant.
    """
    if current_user.role != "enseignant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux enseignants"
        )
    
    # Dans une implémentation réelle, ces recommandations seraient générées
    # par un service d'IA basé sur les données des étudiants
    
    # Exemple de recommandations statiques pour la démonstration
    recommendations = [
        {
            "id": 1,
            "type": "student",
            "title": "Pour Jean Dupont",
            "description": "Recommander des exercices supplémentaires sur les dérivées partielles (niveau avancé).",
            "actionText": "Appliquer",
            "icon": "robot"
        },
        {
            "id": 2,
            "type": "class",
            "title": "Analyse de classe",
            "description": "70% des étudiants ont des difficultés avec le chapitre 3. Considérez une session de révision.",
            "actionText": "Planifier",
            "icon": "chart"
        },
        {
            "id": 3,
            "type": "resource",
            "title": "Nouvelle ressource",
            "description": "Une nouvelle vidéo sur les espaces vectoriels a été ajoutée à la bibliothèque.",
            "actionText": "Voir",
            "icon": "book"
        }
    ]
    
    return recommendations

@router.get("/refresh-recommendations", response_model=List[RecommendationResponse])
async def refresh_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Rafraîchit les recommandations IA pour l'enseignant.
    """
    # Cette fonction simulerait l'appel à un service d'IA pour générer de nouvelles recommandations
    # Pour la démonstration, nous retournons les mêmes recommandations
    return await get_recommendations(db, current_user)

@router.get("/course-completion", response_model=Dict[str, Any])
async def get_course_completion(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère les données d'achèvement des cours pour l'enseignant.
    """
    if current_user.role != "enseignant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux enseignants"
        )
    
    courses = db.query(Course).filter(
        Course.instructor_id == current_user.id
    ).all()
    
    course_completions = []
    total_completion = 0
    
    colors = ["#3f51b5", "#ff9800", "#f44336", "#4caf50", "#2196f3"]
    
    for i, course in enumerate(courses):
        # Calculer le pourcentage moyen d'achèvement pour ce cours
        avg_completion = db.query(UserProgress).filter(
            UserProgress.course_id == course.id
        ).with_entities(
            func.avg(UserProgress.completion_percentage)
        ).scalar() or 0
        
        course_completions.append({
            "id": course.id,
            "name": course.title,
            "completion": round(avg_completion),
            "color": colors[i % len(colors)]
        })
        
        total_completion += avg_completion
    
    # Calculer la moyenne globale
    overall_completion = round(total_completion / len(courses)) if courses else 0
    
    return {
        "courses": course_completions,
        "overall": overall_completion
    }

@router.get("/recent-activities", response_model=List[ActivityResponse])
async def get_recent_activities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère les activités récentes pour l'enseignant.
    """
    if current_user.role != "enseignant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux enseignants"
        )
    
    # Dans une implémentation réelle, ces activités seraient récupérées
    # à partir des logs d'activité ou des événements du système
    
    # Exemple d'activités statiques pour la démonstration
    activities = [
        {
            "id": 1,
            "type": "assignment",
            "title": "Nouveau devoir publié",
            "description": "Calcul différentiel - Chapitre 4",
            "time": "Il y a 2 heures"
        },
        {
            "id": 2,
            "type": "submission",
            "title": "12 devoirs soumis",
            "description": "Mathématiques avancées - TD3",
            "time": "Aujourd'hui, 10:45"
        },
        {
            "id": 3,
            "type": "message",
            "title": "5 nouveaux messages",
            "description": "Forum d'algèbre linéaire",
            "time": "Hier, 18:30"
        },
        {
            "id": 4,
            "type": "resource",
            "title": "Nouvelle vidéo ajoutée",
            "description": "Espaces vectoriels - Partie 2",
            "time": "Hier, 14:15"
        }
    ]
    
    return activities

@router.get("/upcoming-tasks", response_model=List[TaskResponse])
async def get_upcoming_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère les tâches à venir pour l'enseignant.
    """
    if current_user.role != "enseignant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux enseignants"
        )
    
    # Dans une implémentation réelle, ces tâches seraient récupérées
    # à partir de la base de données
    
    # Exemple de tâches statiques pour la démonstration
    tasks = [
        {
            "id": 1,
            "title": "Corriger les devoirs",
            "deadline": "Aujourd'hui, 23:59",
            "priority": "high",
            "completed": False
        },
        {
            "id": 2,
            "title": "Préparer le cours de demain",
            "deadline": "Demain, 08:00",
            "priority": "medium",
            "completed": False
        },
        {
            "id": 3,
            "title": "Réunion du département",
            "deadline": "Mercredi, 14:00",
            "priority": "normal",
            "completed": False
        },
        {
            "id": 4,
            "title": "Publier les notes",
            "deadline": "Vendredi, 18:00",
            "priority": "low",
            "completed": False
        }
    ]
    
    return tasks

@router.put("/task/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Met à jour une tâche de l'enseignant.
    """
    if current_user.role != "enseignant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux enseignants"
        )
    
    # Dans une implémentation réelle, cette tâche serait mise à jour
    # dans la base de données
    
    # Pour la démonstration, nous retournons simplement la tâche mise à jour
    tasks = await get_upcoming_tasks(db, current_user)
    task = next((t for t in tasks if t["id"] == task_id), None)
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tâche non trouvée"
        )
    
    # Mettre à jour la tâche avec les données fournies
    for key, value in task_data.items():
        if key in task:
            task[key] = value
    
    return task

@router.post("/recommendation/{recommendation_id}/action", response_model=Dict[str, str])
async def recommendation_action(
    recommendation_id: int,
    action_data: Dict[str, str],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Exécute une action sur une recommandation.
    """
    if current_user.role != "enseignant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux enseignants"
        )
    
    # Dans une implémentation réelle, cette action serait traitée
    # en fonction du type de recommandation
    
    # Pour la démonstration, nous retournons simplement un message de succès
    return {"message": f"Action {action_data.get('action', 'inconnue')} exécutée avec succès"}
