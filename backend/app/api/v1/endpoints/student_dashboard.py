from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, Table, MetaData, and_
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

# Importer la table de jointure
from app.models.models import course_student

from app.database import get_db
from app.models.user import User
from app.models.progress import UserProgress, UserQuizResult, UserRecommendation
from app.models.quiz import Quiz, QuizQuestion, QuizOption
from app.models.user_quiz_answers import UserQuizAnswer
from app.models.models import Course, Lesson, Module, Category, course_student
from app.services.auth_service import get_current_active_user
from app.schemas.student import (
    DashboardStats, 
    CourseResponse,
    ActivityResponse,
    UpcomingQuizResponse,
    LessonResponse,
    LessonContentResponse
)
from app.schemas.quiz_results import (
    QuizResultDetailResponse,
    QuizResultSummaryResponse,
    QuizHistoryResponse,
    UserAnswerResponse
)

router = APIRouter()

# Constantes pour les messages d'erreur et les vérifications d'accès
ACCESS_FORBIDDEN_MESSAGE = "Accès réservé aux étudiants, enseignants et administrateurs"
ALLOWED_ROLES = ["etudiant", "enseignant", "admin"]

def check_user_access(current_user: User):
    """Vérifie si l'utilisateur a accès au tableau de bord étudiant"""
    if current_user.role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=ACCESS_FORBIDDEN_MESSAGE
        )
    print(f"DEBUG - Accès au tableau de bord étudiant par {current_user.username} avec le rôle {current_user.role}")

@router.get("/dashboard", response_model=Dict[str, Any])
async def get_student_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère toutes les données pour le tableau de bord de l'étudiant.
    """
    check_user_access(current_user)
    
    # Récupérer les statistiques
    stats = await get_dashboard_stats(db, current_user)
    
    # Récupérer les cours en cours
    in_progress_courses = await get_in_progress_courses(db, current_user)
    
    # Récupérer les cours recommandés
    recommended_courses = await get_recommended_courses(db, current_user)
    
    # Récupérer les activités récentes
    recent_activities = await get_recent_activities(db, current_user)
    
    # Récupérer les quiz à venir
    upcoming_quizzes = await get_upcoming_quizzes(db, current_user)
    
    return {
        "stats": stats,
        "inProgressCourses": in_progress_courses,
        "recommendedCourses": recommended_courses,
        "recentActivities": recent_activities,
        "upcomingQuizzes": upcoming_quizzes
    }

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère les statistiques pour le tableau de bord de l'étudiant.
    """
    check_user_access(current_user)
    
    # Compter les cours auxquels l'étudiant est inscrit
    enrolled_courses = db.query(Course).join(
        Course.students
    ).filter(
        User.id == current_user.id
    ).all()
    
    # Compter les cours complétés (progression à 100%)
    completed_courses = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.completion_percentage == 100
    ).count()
    
    # Calculer le temps passé (en heures)
    # Dans une implémentation réelle, cela viendrait d'un suivi du temps passé
    hours_spent = 27  # Valeur de démonstration
    
    # Calculer le score moyen des quiz
    average_score = db.query(UserQuizResult).filter(
        UserQuizResult.user_id == current_user.id
    ).with_entities(
        func.avg(UserQuizResult.score)
    ).scalar() or 0
    
    # Compter le nombre de quiz réussis
    passed_quizzes = db.query(UserQuizResult).filter(
        UserQuizResult.user_id == current_user.id,
        UserQuizResult.passed == True
    ).count()
    
    return {
        "coursesEnrolled": len(enrolled_courses),
        "completedCourses": completed_courses,
        "hoursSpent": hours_spent,
        "averageScore": round(average_score),
        "passedQuizzes": passed_quizzes
    }

@router.get("/in-progress-courses", response_model=List[CourseResponse])
async def get_in_progress_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère les cours en cours pour l'étudiant.
    """
    check_user_access(current_user)
    
    # Récupérer les cours avec progression > 0 et < 100
    courses_with_progress = db.query(
        Course, 
        UserProgress.completion_percentage.label("progress")
    ).join(
        UserProgress, 
        (UserProgress.course_id == Course.id) & (UserProgress.user_id == current_user.id)
    ).filter(
        UserProgress.completion_percentage > 0,
        UserProgress.completion_percentage < 100
    ).all()
    
    result = []
    for course, progress in courses_with_progress:
        # Compter les leçons du cours
        lessons_count = db.query(Lesson).filter(
            Lesson.course_id == course.id
        ).count()
        
        # Compter les leçons complétées
        completed_lessons = db.query(Lesson).join(
            UserProgress, 
            (UserProgress.lesson_id == Lesson.id) & (UserProgress.user_id == current_user.id)
        ).filter(
            Lesson.course_id == course.id,
            UserProgress.completion_percentage == 100
        ).count()
        
        # Calculer la durée totale du cours
        # Dans une implémentation réelle, cela viendrait de la somme des durées des leçons
        duration = "10h 30min"  # Valeur de démonstration
        
        # Récupérer l'instructeur
        instructor = db.query(User).filter(
            User.id == course.instructor_id
        ).first()
        
        # Récupérer les tags du cours
        # Dans une implémentation réelle, cela viendrait d'une table de tags
        tags = ["Mathématiques", "Universitaire"]  # Valeurs de démonstration
        
        result.append({
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "imageUrl": course.thumbnail_url or f"https://source.unsplash.com/random/800x600/?{course.title.replace(' ', '+')}",
            "instructor": {
                "id": instructor.id,
                "name": instructor.full_name,
                "avatar": f"https://randomuser.me/api/portraits/{'women' if instructor.id % 2 == 0 else 'men'}/{instructor.id % 70}.jpg",
            },
            "progress": round(progress),
            "duration": duration,
            "lessonsCount": lessons_count,
            "completedLessons": completed_lessons,
            "tags": tags
        })
    
    return result

@router.get("/recommended-courses", response_model=List[CourseResponse])
async def get_recommended_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère les cours recommandés pour l'étudiant.
    """
    check_user_access(current_user)
    
    # Dans une implémentation réelle, ces recommandations seraient basées sur
    # les intérêts de l'étudiant, ses cours précédents, etc.
    
    # Récupérer les cours auxquels l'étudiant n'est pas encore inscrit
    enrolled_course_ids = db.query(course_student.c.course_id).filter(
        course_student.c.student_id == current_user.id
    ).all()
    
    enrolled_ids = [course_id for (course_id,) in enrolled_course_ids]
    
    print(f"DEBUG - Étudiant {current_user.id} inscrit aux cours: {enrolled_ids}")
    
    # Récupérer tous les cours disponibles sauf ceux auxquels l'étudiant est inscrit
    if enrolled_ids:
        recommended_courses = db.query(Course).filter(
            ~Course.id.in_(enrolled_ids)
        ).limit(3).all()
    else:
        # Si l'étudiant n'est inscrit à aucun cours, recommander les 3 premiers cours
        recommended_courses = db.query(Course).limit(3).all()
    
    print(f"DEBUG - Cours recommandés trouvés: {len(recommended_courses)}")
    
    result = []
    for course in recommended_courses:
        print(f"DEBUG - Traitement du cours {course.id}: {course.title}")
        # Compter les leçons du cours
        lessons_count = db.query(Lesson).filter(
            Lesson.course_id == course.id
        ).count()
        
        # Calculer la durée totale du cours
        # Dans une implémentation réelle, cela viendrait de la somme des durées des leçons
        duration = "12h 45min"  # Valeur de démonstration
        
        # Récupérer l'instructeur
        instructor = db.query(User).filter(
            User.id == course.instructor_id
        ).first()
        
        # Récupérer les tags du cours
        # Dans une implémentation réelle, cela viendrait d'une table de tags
        tags = ["Statistiques", "Data Science"]  # Valeurs de démonstration
        
        result.append({
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "imageUrl": course.thumbnail_url or f"https://source.unsplash.com/random/800x600/?{course.title.replace(' ', '+')}",
            "instructor": {
                "id": instructor.id,
                "name": instructor.full_name,
                "avatar": f"https://randomuser.me/api/portraits/{'women' if instructor.id % 2 == 0 else 'men'}/{instructor.id % 70}.jpg",
            },
            "progress": 0,
            "duration": duration,
            "lessonsCount": lessons_count,
            "completedLessons": 0,
            "tags": tags,
            "isRecommended": True
        })
    
    print(f"DEBUG - Retour de {len(result)} cours recommandés")
    return result

@router.get("/recent-activities", response_model=List[ActivityResponse])
async def get_recent_activities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère les activités récentes de l'étudiant.
    """
    check_user_access(current_user)
    
    # Récupérer les résultats de quiz récents
    recent_quiz_results = db.query(UserQuizResult, Quiz, Lesson, Course).join(
        Quiz, UserQuizResult.quiz_id == Quiz.id
    ).join(
        Lesson, Quiz.lesson_id == Lesson.id
    ).join(
        Course, Lesson.course_id == Course.id
    ).filter(
        UserQuizResult.user_id == current_user.id
    ).order_by(
        UserQuizResult.completed_at.desc()
    ).limit(5).all()
    
    # Récupérer les leçons récemment complétées
    recent_lessons = db.query(UserProgress, Lesson, Course).join(
        Lesson, UserProgress.lesson_id == Lesson.id
    ).join(
        Course, Lesson.course_id == Course.id
    ).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.is_completed == True
    ).order_by(
        UserProgress.updated_at.desc()
    ).limit(5).all()
    
    activities = []
    
    # Ajouter les résultats de quiz
    for result, quiz, lesson, course in recent_quiz_results:
        time_diff = datetime.now() - result.completed_at
        if time_diff.days > 0:
            time_str = f"Il y a {time_diff.days} jour{'s' if time_diff.days > 1 else ''}"
        else:
            hours = time_diff.seconds // 3600
            if hours > 0:
                time_str = f"Il y a {hours} heure{'s' if hours > 1 else ''}"
            else:
                minutes = (time_diff.seconds % 3600) // 60
                time_str = f"Il y a {minutes} minute{'s' if minutes > 1 else ''}"
        
        activities.append({
            "id": result.id,
            "type": "quiz",
            "title": "Quiz complété",
            "description": f"Vous avez obtenu {result.score}% au quiz '{quiz.title}'",
            "time": time_str,
            "course": {
                "id": course.id,
                "title": course.title,
            },
        })
    
    # Ajouter les leçons complétées
    for progress, lesson, course in recent_lessons:
        time_diff = datetime.now() - progress.updated_at
        if time_diff.days > 0:
            time_str = f"Il y a {time_diff.days} jour{'s' if time_diff.days > 1 else ''}"
        else:
            hours = time_diff.seconds // 3600
            if hours > 0:
                time_str = f"Il y a {hours} heure{'s' if hours > 1 else ''}"
            else:
                minutes = (time_diff.seconds % 3600) // 60
                time_str = f"Il y a {minutes} minute{'s' if minutes > 1 else ''}"
        
        activities.append({
            "id": progress.id,
            "type": "course",
            "title": "Leçon terminée",
            "description": f"Vous avez terminé la leçon '{lesson.title}'",
            "time": time_str,
            "course": {
                "id": course.id,
                "title": course.title,
            },
        })
    
    # Trier les activités par date (les plus récentes d'abord)
    activities.sort(key=lambda x: x["time"], reverse=True)
    
    return activities[:5]  # Retourner les 5 activités les plus récentes

@router.get("/upcoming-quizzes", response_model=List[UpcomingQuizResponse])
async def get_upcoming_quizzes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère les quiz à venir pour l'étudiant.
    """
    check_user_access(current_user)
    
    # Récupérer les cours auxquels l'étudiant est inscrit
    enrolled_courses = db.query(Course.id).join(
        Course.students
    ).filter(
        User.id == current_user.id
    ).all()
    
    enrolled_course_ids = [course_id for (course_id,) in enrolled_courses]
    
    # Récupérer les quiz que l'étudiant n'a pas encore complétés
    completed_quiz_ids = db.query(UserQuizResult.quiz_id).filter(
        UserQuizResult.user_id == current_user.id
    ).all()
    
    completed_ids = [quiz_id for (quiz_id,) in completed_quiz_ids]
    
    # Récupérer les quiz actifs des cours auxquels l'étudiant est inscrit
    upcoming_quizzes_query = db.query(Quiz, Lesson, Course).join(
        Lesson, Quiz.lesson_id == Lesson.id
    ).join(
        Course, Lesson.course_id == Course.id
    ).filter(
        Course.id.in_(enrolled_course_ids),
        Quiz.is_active == True,
        ~Quiz.id.in_(completed_ids) if completed_ids else True
    ).all()
    
    result = []
    for quiz, lesson, course in upcoming_quizzes_query:
        # Calculer la date d'échéance (pour la démonstration, on utilise une date future)
        due_date = datetime.now() + timedelta(days=7)
        time_remaining = due_date - datetime.now()
        days = time_remaining.days
        hours = time_remaining.seconds // 3600
        
        result.append({
            "id": quiz.id,
            "title": quiz.title,
            "courseTitle": course.title,
            "courseId": course.id,
            "dueDate": due_date.strftime("%d/%m/%Y, %H:%M"),
            "timeRemaining": f"{days} jour{'s' if days > 1 else ''} et {hours} heure{'s' if hours > 1 else ''}",
            "isImportant": days < 2  # Important si moins de 2 jours restants
        })
    
    return result

@router.get("/quiz-history", response_model=QuizHistoryResponse)
async def get_quiz_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère l'historique des quiz complétés par l'étudiant.
    """
    check_user_access(current_user)
    
    # Récupérer tous les résultats de quiz de l'étudiant
    quiz_results = db.query(UserQuizResult, Quiz, Lesson, Course).join(
        Quiz, UserQuizResult.quiz_id == Quiz.id
    ).join(
        Lesson, Quiz.lesson_id == Lesson.id
    ).join(
        Course, Lesson.course_id == Course.id
    ).filter(
        UserQuizResult.user_id == current_user.id
    ).order_by(
        UserQuizResult.completed_at.desc()
    ).all()
    
    results = []
    for result, quiz, lesson, course in quiz_results:
        # Compter le nombre de questions dans le quiz
        question_count = db.query(QuizQuestion).filter(
            QuizQuestion.quiz_id == quiz.id
        ).count()
        
        # Compter le nombre de réponses correctes
        correct_answers = db.query(UserQuizAnswer).filter(
            UserQuizAnswer.user_id == current_user.id,
            UserQuizAnswer.quiz_id == quiz.id,
            UserQuizAnswer.is_correct == True
        ).count()
        
        results.append({
            "id": result.id,
            "quiz_id": quiz.id,
            "quiz_title": quiz.title,
            "score": result.score,
            "passed": result.passed,
            "completed_at": result.completed_at,
            "total_questions": question_count,
            "correct_answers": correct_answers,
            "course_id": course.id,
            "course_title": course.title
        })
    
    # Calculer les statistiques globales
    total_quizzes = len(results)
    average_score = sum(r["score"] for r in results) / total_quizzes if total_quizzes > 0 else 0
    passed_quizzes = sum(1 for r in results if r["passed"])
    
    return {
        "results": results,
        "total_quizzes": total_quizzes,
        "average_score": round(average_score, 2),
        "passed_quizzes": passed_quizzes
    }

@router.get("/quiz-results/{quiz_result_id}", response_model=QuizResultDetailResponse)
async def get_quiz_result_details(
    quiz_result_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère les détails d'un résultat de quiz spécifique.
    """
    check_user_access(current_user)
    
    # Récupérer le résultat du quiz
    quiz_result = db.query(UserQuizResult).filter(
        UserQuizResult.id == quiz_result_id,
        UserQuizResult.user_id == current_user.id
    ).first()
    
    if not quiz_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Résultat de quiz non trouvé"
        )
    
    # Récupérer le quiz
    quiz = db.query(Quiz).filter(Quiz.id == quiz_result.quiz_id).first()
    
    # Récupérer les réponses de l'utilisateur
    user_answers = db.query(UserQuizAnswer, QuizQuestion, QuizOption).join(
        QuizQuestion, UserQuizAnswer.question_id == QuizQuestion.id
    ).outerjoin(
        QuizOption, UserQuizAnswer.option_id == QuizOption.id
    ).filter(
        UserQuizAnswer.user_id == current_user.id,
        UserQuizAnswer.quiz_id == quiz_result.quiz_id
    ).all()
    
    answers = []
    for answer, question, option in user_answers:
        # Récupérer l'option correcte pour cette question
        correct_option = db.query(QuizOption).filter(
            QuizOption.question_id == question.id,
            QuizOption.is_correct == True
        ).first()
        
        answers.append({
            "question_id": question.id,
            "question_text": question.question_text,
            "selected_option_id": option.id if option else None,
            "selected_option_text": option.option_text if option else None,
            "answer_text": answer.answer_text,
            "is_correct": answer.is_correct,
            "correct_option_text": correct_option.option_text if correct_option else None
        })
    
    # Compter le nombre total de questions et de réponses correctes
    total_questions = len(answers)
    correct_answers = sum(1 for a in answers if a["is_correct"])
    
    return {
        "quiz_id": quiz.id,
        "quiz_title": quiz.title,
        "score": quiz_result.score,
        "passed": quiz_result.passed,
        "completed_at": quiz_result.completed_at,
        "answers": answers,
        "total_questions": total_questions,
        "correct_answers": correct_answers
    }

@router.get("/all-courses", response_model=List[Dict[str, Any]])
async def get_all_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère tous les cours disponibles avec les informations de progression pour l'étudiant.
    """
    check_user_access(current_user)
    
    # Récupérer tous les cours publiés
    courses = db.query(Course).filter(
        Course.status == 'published'
    ).all()
    
    result = []
    for course in courses:
        # Récupérer la catégorie
        category = db.query(Category).filter(Category.id == course.category_id).first()
        
        # Récupérer l'instructeur
        instructor = db.query(User).filter(User.id == course.instructor_id).first()
        
        # Vérifier si l'étudiant est inscrit au cours
        is_enrolled = db.query(Course).join(
            Course.students
        ).filter(
            Course.id == course.id,
            User.id == current_user.id
        ).first() is not None
        
        # Récupérer la progression de l'étudiant dans ce cours (si inscrit)
        progress_percentage = 0
        if is_enrolled:
            progress = db.query(UserProgress).filter(
                UserProgress.user_id == current_user.id,
                UserProgress.course_id == course.id
            ).first()
            if progress:
                progress_percentage = progress.completion_percentage
        
        # Récupérer les modules et leçons
        modules = db.query(Module).filter(
            Module.course_id == course.id
        ).order_by(Module.order_index).all()
        
        formatted_modules = []
        total_lessons = 0
        completed_lessons = 0
        
        for module in modules:
            lessons = db.query(Lesson).filter(
                Lesson.module_id == module.id
            ).order_by(Lesson.order_index).all()
            
            formatted_lessons = []
            for lesson in lessons:
                total_lessons += 1
                
                # Vérifier si la leçon est complétée
                is_completed = False
                if is_enrolled:
                    lesson_completion = db.query(LessonCompletion).filter(
                        LessonCompletion.user_id == current_user.id,
                        LessonCompletion.lesson_id == lesson.id
                    ).first()
                    is_completed = lesson_completion is not None
                    if is_completed:
                        completed_lessons += 1
                
                formatted_lessons.append({
                    "id": lesson.id,
                    "title": lesson.title,
                    "description": lesson.description,
                    "duration": lesson.duration,
                    "order_index": lesson.order_index,
                    "is_completed": is_completed,
                    "is_free": lesson.is_free
                })
            
            formatted_modules.append({
                "id": module.id,
                "title": module.title,
                "description": module.description,
                "order_index": module.order_index,
                "lessons": formatted_lessons
            })
        
        # Calculer le nombre d'étudiants inscrits
        students_count = db.query(func.count(User.id)).join(
            Course.students
        ).filter(Course.id == course.id).scalar() or 0
        
        # Récupérer les tags
        tags = [{
            "id": tag.id,
            "name": tag.name
        } for tag in course.tags]
        
        result.append({
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "short_description": course.short_description,
            "thumbnail_url": course.thumbnail_url,
            "price": float(course.price),
            "status": course.status,
            "level": course.level,
            "difficulty_level": course.level,  # Alias pour compatibilité
            "created_at": course.created_at.isoformat() if course.created_at else None,
            "updated_at": course.updated_at.isoformat() if course.updated_at else None,
            "instructor": {
                "id": instructor.id if instructor else None,
                "name": f"{instructor.first_name} {instructor.last_name}" if instructor else "Instructeur inconnu",
                "avatar": None  # À implémenter si nécessaire
            },
            "category": {
                "id": category.id if category else None,
                "name": category.name if category else "Général",
                "description": category.description if category else None
            },
            "tags": tags,
            "modules": formatted_modules,
            "progress": progress_percentage,
            "is_enrolled": is_enrolled,
            "students_count": students_count,
            "average_rating": 4.5,  # Valeur par défaut, à implémenter avec un système de notation
            "isNew": (datetime.now() - course.created_at).days < 30 if course.created_at else False,
            "isPopular": students_count > 50
        })
    
    return result

@router.get("/courses/{course_id}", response_model=Dict[str, Any])
async def get_course_details(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère les détails d'un cours pour l'étudiant.
    """
    check_user_access(current_user)
    
    # Vérifier que l'étudiant est inscrit au cours
    course = db.query(Course).filter(
        Course.id == course_id
    ).first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cours non trouvé"
        )
    
    # Vérifier que l'étudiant est inscrit au cours
    is_enrolled = db.query(Course).join(
        Course.students
    ).filter(
        Course.id == course_id,
        User.id == current_user.id
    ).first() is not None
    
    if not is_enrolled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas inscrit à ce cours"
        )
    
    # Récupérer la progression de l'étudiant dans ce cours
    progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.course_id == course_id
    ).first()
    
    # Récupérer les modules avec leurs leçons
    modules = db.query(Module).filter(Module.course_id == course_id).order_by(Module.order_index).all()
    modules_data = []
    all_lessons = []  # Pour compatibilité avec l'ancien format
    
    for module in modules:
        lessons = db.query(Lesson).filter(Lesson.module_id == module.id).order_by(Lesson.order_index).all()
        lessons_data = []
        
        for lesson in lessons:
            # Vérifier si la leçon est complétée
            lesson_progress = db.query(UserProgress).filter(
                UserProgress.user_id == current_user.id,
                UserProgress.lesson_id == lesson.id
            ).first()
            
            is_completed = lesson_progress and lesson_progress.completion_percentage == 100
            lesson_progress_value = lesson_progress.completion_percentage if lesson_progress else 0
            
            # Déterminer si la leçon est verrouillée
            is_locked = False
            if lesson.order_index > 1:
                previous_lesson = db.query(Lesson).filter(
                    Lesson.module_id == module.id,
                    Lesson.order_index == lesson.order_index - 1
                ).first()
                
                if previous_lesson:
                    previous_completed = db.query(UserProgress).filter(
                        UserProgress.user_id == current_user.id,
                        UserProgress.lesson_id == previous_lesson.id,
                        UserProgress.completion_percentage == 100
                    ).first() is not None
                    
                    is_locked = not previous_completed
            
            lesson_data = {
                "id": lesson.id,
                "title": lesson.title,
                "description": lesson.description,
                "content": lesson.content,
                "video_url": lesson.video_url,
                "duration": lesson.duration or 600,  # Durée en secondes
                "order": lesson.order_index,
                "is_free": lesson.is_free,
                "isCompleted": is_completed,
                "isLocked": is_locked,
                "progress": lesson_progress_value if not is_completed and lesson_progress_value > 0 else None
            }
            
            lessons_data.append(lesson_data)
            all_lessons.append(lesson_data)  # Pour compatibilité
        
        modules_data.append({
            "id": module.id,
            "title": module.title,
            "description": module.description,
            "order": module.order_index,
            "lessons": lessons_data
        })
    
    # Récupérer l'instructeur
    instructor = db.query(User).filter(
        User.id == course.instructor_id
    ).first()
    
    # Compter les leçons complétées
    completed_lessons = sum(1 for lesson in all_lessons if lesson["isCompleted"])
    
    return {
        "course": {
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "instructor": {
                "id": instructor.id,
                "name": instructor.full_name,
                "avatar": f"https://randomuser.me/api/portraits/{'women' if instructor.id % 2 == 0 else 'men'}/{instructor.id % 70}.jpg",
            },
            "progress": progress.completion_percentage if progress else 0,
            "duration": "10h 30min",  # Valeur de démonstration
            "lessonsCount": len(all_lessons),
            "completedLessons": completed_lessons
        },
        "lessons": all_lessons,  # Pour compatibilité avec l'ancien format
        "modules": modules_data  # Nouvelle structure avec modules
    }

@router.get("/lessons/{lesson_id}", response_model=LessonContentResponse)
async def get_lesson_content(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère le contenu d'une leçon pour l'étudiant.
    """
    check_user_access(current_user)
    
    # Récupérer la leçon
    lesson = db.query(Lesson).filter(
        Lesson.id == lesson_id
    ).first()
    
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leçon non trouvée"
        )
    
    # Vérifier que l'étudiant est inscrit au cours
    course = db.query(Course).filter(
        Course.id == lesson.course_id
    ).first()
    
    if not course:
        print(f"ERREUR - Cours {lesson.course_id} non trouvé")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cours non trouvé"
        )
    
    # Log pour déboguer
    print(f"DEBUG - Vérification de l'inscription pour l'utilisateur {current_user.id} au cours {lesson.course_id} (Titre: {course.title})")
    
    # Vérifier les étudiants inscrits au cours
    student_count = db.query(Course).join(
        Course.students
    ).filter(
        Course.id == lesson.course_id
    ).count()
    
    print(f"DEBUG - Nombre total d'étudiants inscrits au cours: {student_count}")
    
    # Vérifier si l'utilisateur est inscrit en utilisant la table de jointure directement
    is_enrolled = db.query(Course).join(
        course_student,
        Course.id == course_student.c.course_id
    ).filter(
        course_student.c.student_id == current_user.id,
        Course.id == lesson.course_id
    ).first() is not None
    
    print(f"DEBUG - Utilisateur {'inscrit' if is_enrolled else 'non inscrit'} au cours")
    
    print(f"DEBUG - Utilisateur {'inscrit' if is_enrolled else 'non inscrit'} au cours")
    
    # Pour déboguer, afficher tous les étudiants inscrits
    if not is_enrolled:
        print("DEBUG - Liste des étudiants inscrits au cours:")
        enrolled_students = db.query(User).join(
            Course.students
        ).filter(
            Course.id == lesson.course_id
        ).all()
        for student in enrolled_students:
            print(f"- {student.id}: {student.username} ({student.email})")
    
    if not is_enrolled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas inscrit à ce cours"
        )
    
    # Vérifier si la leçon est verrouillée
    if lesson.order_index > 1:
        # Vérifier si la leçon précédente est gratuite
        previous_lesson = db.query(Lesson).filter(
            Lesson.course_id == lesson.course_id,
            Lesson.order_index == lesson.order_index - 1
        ).first()
        
        if previous_lesson:
            # Si la leçon précédente est gratuite, pas besoin de vérifier la progression
            if previous_lesson.is_free:
                print(f"DEBUG - Accès autorisé car la leçon précédente {previous_lesson.title} est gratuite")
            else:
                previous_completed = db.query(UserProgress).filter(
                    UserProgress.user_id == current_user.id,
                    UserProgress.lesson_id == previous_lesson.id,
                    UserProgress.completion_percentage == 100
                ).first() is not None
                
                if not previous_completed:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Vous devez d'abord compléter les leçons précédentes"
                    )
    
    # Dans une implémentation réelle, le contenu de la leçon serait récupéré
    # à partir d'une table de contenu ou d'un système de stockage
    
    # Exemple de contenu statique pour la démonstration
    content = lesson.video_url if lesson.video_url else lesson.content
    
    # Exemple de pièces jointes statiques pour la démonstration
    attachments = [
        {
            "id": 1,
            "name": f"{lesson.title}_document.pdf",
            "url": "#",
            "type": "pdf",
        },
        {
            "id": 2,
            "name": f"{lesson.title}_exercices.pdf",
            "url": "#",
            "type": "pdf",
        },
    ] if lesson.video_url else []
    
    return {
        "id": lesson.id,
        "title": lesson.title,
        "type": "video" if lesson.video_url else "text",
        "content": content,
        "duration": f"{lesson.duration // 60}:{lesson.duration % 60:02d}" if isinstance(lesson.duration, (int, float)) else "10:00",
        "description": lesson.description or f"Description détaillée de la leçon {lesson.title}",
        "attachments": attachments
    }

@router.post("/lessons/{lesson_id}/complete", response_model=Dict[str, Any])
async def complete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Marque une leçon comme terminée pour l'étudiant.
    """
    check_user_access(current_user)
    
    # Récupérer la leçon
    lesson = db.query(Lesson).filter(
        Lesson.id == lesson_id
    ).first()
    
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Leçon non trouvée"
        )
    
    # Vérifier que l'étudiant est inscrit au cours
    is_enrolled = db.query(Course).join(
        Course.students
    ).filter(
        Course.id == lesson.course_id,
        User.id == current_user.id
    ).first() is not None
    
    if not is_enrolled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas inscrit à ce cours"
        )
    
    # Mettre à jour la progression de l'étudiant pour cette leçon
    lesson_progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.lesson_id == lesson.id
    ).first()
    
    if lesson_progress:
        lesson_progress.completion_percentage = 100
        lesson_progress.last_accessed = datetime.now()
    else:
        lesson_progress = UserProgress(
            user_id=current_user.id,
            lesson_id=lesson.id,
            course_id=lesson.course_id,
            completion_percentage=100,
            last_accessed=datetime.now()
        )
        db.add(lesson_progress)
    
    # Mettre à jour la progression globale du cours
    total_lessons = db.query(Lesson).filter(
        Lesson.course_id == lesson.course_id
    ).count()
    
    completed_lessons = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.lesson_id.in_(
            db.query(Lesson.id).filter(Lesson.course_id == lesson.course_id)
        ),
        UserProgress.completion_percentage == 100
    ).count()
    
    course_progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.course_id == lesson.course_id,
        UserProgress.lesson_id == None
    ).first()
    
    course_completion = (completed_lessons / total_lessons) * 100 if total_lessons > 0 else 0
    
    if course_progress:
        course_progress.completion_percentage = course_completion
        course_progress.last_accessed = datetime.now()
    else:
        course_progress = UserProgress(
            user_id=current_user.id,
            course_id=lesson.course_id,
            lesson_id=None,
            completion_percentage=course_completion,
            last_accessed=datetime.now()
        )
        db.add(course_progress)
    
    db.commit()
    
    return {
        "success": True,
        "message": "Leçon marquée comme terminée",
        "courseProgress": course_completion
    }

@router.post("/enroll/{course_id}", response_model=Dict[str, Any])
async def enroll_in_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Inscrit un étudiant à un cours.
    """
    # Vérifier que l'utilisateur est un étudiant
    if current_user.role != "etudiant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seuls les étudiants peuvent s'inscrire aux cours"
        )
    
    # Vérifier que le cours existe
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cours non trouvé"
        )
    
    # Vérifier que l'étudiant n'est pas déjà inscrit
    existing_enrollment = db.query(course_student).filter(
        course_student.c.course_id == course_id,
        course_student.c.student_id == current_user.id
    ).first()
    
    if existing_enrollment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous êtes déjà inscrit à ce cours"
        )
    
    # Créer l'inscription
    try:
        # Insérer dans la table de jointure course_student
        stmt = course_student.insert().values(
            course_id=course_id,
            student_id=current_user.id
        )
        db.execute(stmt)
        db.commit()
        
        print(f"DEBUG - Étudiant {current_user.id} inscrit au cours {course_id} ({course.title})")
        
        return {
            "success": True,
            "message": "Inscription au cours réussie",
            "courseId": course_id,
            "courseTitle": course.title
        }
        
    except Exception as e:
        db.rollback()
        print(f"ERREUR - Inscription échouée: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de l'inscription au cours"
        )

from app.schemas.student import CourseResponse

@router.get("/courses/unenrolled", response_model=List[CourseResponse])
async def get_unenrolled_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère la liste des cours auxquels l'étudiant n'est pas inscrit.
    """
    print(f"Début de get_unenrolled_courses pour l'utilisateur {current_user.id} (rôle: {current_user.role})")
    
    # Vérifier que l'utilisateur est un étudiant
    if current_user.role != "etudiant":
        print(f"Accès refusé: l'utilisateur {current_user.id} n'est pas un étudiant (rôle: {current_user.role})")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé. Cette fonctionnalité est réservée aux étudiants."
        )
    
    try:
        # Récupérer les IDs des cours auxquels l'étudiant est déjà inscrit
        enrolled_course_ids = db.query(course_student.c.course_id).filter(
            course_student.c.student_id == current_user.id
        ).subquery()
        
        print(f"Cours suivis par l'étudiant: {db.execute(enrolled_course_ids).fetchall()}")
        
        # Récupérer les cours non suivis avec le nombre de leçons
        unenrolled_courses = db.query(
            Course,
            func.count(Lesson.id).label('lessons_count')
        ).outerjoin(
            Module, Course.id == Module.course_id
        ).outerjoin(
            Lesson, Module.id == Lesson.module_id
        ).filter(
            and_(
                Course.id.notin_(enrolled_course_ids),
                Course.status == "published"  # Ne récupérer que les cours publiés
            )
        ).group_by(Course.id).options(
            joinedload(Course.instructor),
            joinedload(Course.category),
            joinedload(Course.modules).joinedload(Module.lessons)
        ).all()
        
        print(f"Nombre de cours non suivis trouvés: {len(unenrolled_courses)}")
        
        # Formater la réponse selon le schéma attendu
        result = []
        for course, lessons_count in unenrolled_courses:
            # Calculer la durée totale du cours (en minutes)
            total_duration = sum(lesson.duration or 0 for module in course.modules for lesson in module.lessons)
            
            # Formater la durée en heures et minutes
            hours = total_duration // 60
            minutes = total_duration % 60
            duration_str = f"{hours}h{minutes:02d}" if hours > 0 else f"{minutes}min"
            
            # Récupérer les tags du cours
            tags = [tag.name for tag in course.tags] if hasattr(course, 'tags') else []
            
            # S'assurer que tous les champs requis sont présents et correctement formatés
            course_data = {
                "id": course.id,
                "title": course.title,
                "description": course.short_description or "Aucune description disponible",
                "imageUrl": course.thumbnail_url or "https://via.placeholder.com/300x200?text=No+Image",
                "instructor": {
                    "id": course.instructor.id,
                    "name": f"{course.instructor.first_name or ''} {course.instructor.last_name or ''}".strip() or "Inconnu",
                    "avatar": course.instructor.avatar_url or "https://via.placeholder.com/50"
                },
                "progress": 0,  # Toujours 0 car cours non suivi
                "duration": duration_str,
                "lessonsCount": lessons_count or 0,  # S'assurer que c'est un nombre
                "completedLessons": 0,  # Toujours 0 car cours non suivi
                "tags": tags if isinstance(tags, list) else [],  # S'assurer que c'est une liste
                "isRecommended": False  # Par défaut à False
            }
            
            # Validation des types pour s'assurer qu'ils correspondent au schéma
            if not isinstance(course_data["lessonsCount"], int):
                course_data["lessonsCount"] = 0
            if not isinstance(course_data["progress"], int):
                course_data["progress"] = 0
            if not isinstance(course_data["completedLessons"], int):
                course_data["completedLessons"] = 0
            result.append(course_data)
        
        # Afficher un exemple des données avant validation
        if result:
            print("\n=== Données avant validation (premier élément) ===")
            print(f"Type: {type(result[0])}")
            print(f"Données: {result[0]}")
            
            # Vérification des types
            print("\nVérification des types:")
            for key, value in result[0].items():
                print(f"- {key}: {type(value).__name__} = {value}")
            
            # Vérification des champs obligatoires
            required_fields = ["id", "title", "description", "imageUrl", "instructor", 
                             "progress", "duration", "lessonsCount", "completedLessons", "tags"]
            missing_fields = [field for field in required_fields if field not in result[0]]
            if missing_fields:
                print(f"\n⚠ Champs manquants: {missing_fields}")
            else:
                print("\n✅ Tous les champs obligatoires sont présents")
        
        print(f"\nCours non suivis formatés: {len(result)} cours")
        
        # Valider manuellement avec le schéma
        try:
            from app.schemas.student import CourseResponse
            validated_result = [CourseResponse(**course) for course in result]
            print("✅ Validation du schéma réussie")
            return result
        except Exception as validation_error:
            print(f"\n❌ Erreur de validation du schéma: {str(validation_error)}")
            raise validation_error
        
    except Exception as e:
        import traceback
        error_msg = f"Erreur lors de la récupération des cours non suivis: {str(e)}\n{traceback.format_exc()}"
        print(f"\n❌ {error_msg}")
        logger.error(error_msg)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Une erreur est survenue lors de la récupération des cours: {str(e)}"
        )
