from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timezone, timedelta
import uuid

from fastapi import APIRouter, Depends, HTTPException, status, Query, Body, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, validator

from app import models
from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.user_quiz_answers import UserQuizAnswer
from app.models.progress import UserQuizResult

router = APIRouter()

# Constantes pour les messages d'erreur
ACCESS_DENIED_STUDENTS = "Accès réservé aux étudiants"
ACCESS_DENIED_TEACHERS = "Accès réservé aux enseignants"
QUIZ_NOT_FOUND = "Quiz non trouvé"
INVALID_QUIZ_DATA = "Données du quiz invalides"
INVALID_QUESTION_TYPE = "Type de question invalide"
INVALID_OPTIONS = "Options de question invalides"
SUBMISSION_FAILED = "Échec de la soumission du quiz"

# Constantes pour les rôles
ROLE_STUDENT = "etudiant"
ROLE_TEACHER = "enseignant"

# Constantes pour les types de questions
QUESTION_TYPE_SINGLE = "single"
QUESTION_TYPE_MULTIPLE = "multiple"
QUESTION_TYPE_TEXT = "text"

# Constantes pour les statuts de quiz
QUIZ_STATUS_DRAFT = "draft"
QUIZ_STATUS_PUBLISHED = "published"
QUIZ_STATUS_ARCHIVED = "archived"

# Constantes pour les résultats de quiz
PASSING_SCORE = 60
MAX_ATTEMPTS = 3

# Fonction utilitaire pour obtenir l'heure actuelle avec timezone
def get_current_time() -> datetime:
    return datetime.now(timezone.utc)

# Fonction utilitaire pour formater une réponse d'erreur
def error_response(message: str, status_code: int = status.HTTP_400_BAD_REQUEST) -> Dict[str, Any]:
    return {"error": message, "status_code": status_code}

# Fonction utilitaire pour formater une réponse de succès
def success_response(data: Any, message: str = "Succès") -> Dict[str, Any]:
    return {"data": data, "message": message, "success": True}

# Fonction utilitaire pour récupérer les questions et options d'un quiz
def get_quiz_questions(db: Session, quiz_id: int):
    from app.models.quiz import QuizQuestion as QuizQuestionModel
    from app.models.quiz import QuizOption as QuizOptionModel
    
    print(f"Récupération des questions pour le quiz {quiz_id}")
    
    # Récupérer les questions du quiz
    questions = db.query(QuizQuestionModel).filter(QuizQuestionModel.quiz_id == quiz_id).all()
    
    print(f"Nombre de questions trouvées: {len(questions)}")
    
    questions_data = []
    for question in questions:
        # Récupérer les options de la question
        options = db.query(QuizOptionModel).filter(QuizOptionModel.question_id == question.id).all()
        
        # Créer les données de la question au format attendu par le frontend
        question_data = {
            "id": str(question.id),
            "text": question.question_text,
            "type": question.question_type,
            "options": [
                {
                    "id": str(option.id),
                    "text": option.option_text,
                    "isCorrect": option.is_correct
                } for option in options
            ]
        }
        
        questions_data.append(question_data)
    
    return questions_data

# Schémas Pydantic pour les quiz
class BaseQuestionOption(BaseModel):
    id: str
    text: str

class TeacherQuestionOption(BaseQuestionOption):
    isCorrect: bool = Field(..., description="Indique si cette option est la bonne réponse")

class StudentQuestionOption(BaseQuestionOption):
    pass

class BaseQuizQuestion(BaseModel):
    id: str
    text: str
    type: str = "single"
    correctAnswer: Optional[str] = None

class TeacherQuizQuestion(BaseQuizQuestion):
    options: List[TeacherQuestionOption] = []

class StudentQuizQuestion(BaseQuizQuestion):
    options: List[StudentQuestionOption] = []  # Pour les questions de type texte
    
    @validator('options')
    def validate_options(cls, options, values):
        # Si c'est une question à choix multiples ou unique, vérifier qu'il y a au moins une réponse correcte
        if 'type' in values and values['type'] in ['single', 'multiple']:
            # Convertir les valeurs booléennes en chaînes et les comparer pour s'assurer qu'elles sont correctement interprétées
            has_correct = False
            for option in options:
                # S'assurer que isCorrect est un booléen
                if isinstance(option.isCorrect, str):
                    option.isCorrect = option.isCorrect.lower() in ('true', '1', 't', 'y', 'yes')
                has_correct = has_correct or bool(option.isCorrect)
            
            if not has_correct:
                raise ValueError("Chaque question doit avoir au moins une réponse correcte")
        return options

class QuizBase(BaseModel):
    title: str
    description: str
    courseId: int
    timeLimit: Optional[int] = None  # en minutes
    passingScore: int = 60
    dueDate: Optional[datetime] = None
    isPublished: bool = Field(default=True, description="Tous les quiz sont automatiquement publiés")

class QuizCreate(QuizBase):
    questions: List[TeacherQuizQuestion] = []

class QuizUpdate(QuizBase):
    id: int
    questions: List[TeacherQuizQuestion] = []

class BaseQuizResponse(BaseModel):
    id: int
    title: str
    description: str
    courseId: Optional[int] = None  # Optionnel pour éviter l'erreur de validation
    timeLimit: Optional[int] = None
    passingScore: int = 60
    dueDate: Optional[datetime] = None
    isPublished: bool = True
    createdAt: datetime
    updatedAt: datetime
    submissionsCount: int = 0
    averageScore: Optional[float] = None

class TeacherQuizResponse(BaseQuizResponse):
    questions: List[TeacherQuizQuestion] = []

class StudentQuizResponse(BaseQuizResponse):
    questions: List[StudentQuizQuestion] = []

class QuizSubmissionAnswer(BaseModel):
    questionId: str
    answer: Any  # Peut être une chaîne ou une liste de chaînes selon le type de question

class QuizSubmission(BaseModel):
    quizId: int
    answers: List[QuizSubmissionAnswer]
    timeSpent: Optional[int] = None  # en secondes

class QuizSubmissionResult(BaseModel):
    id: int
    quizId: int
    studentId: int
    score: float
    isPassed: bool
    submittedAt: datetime
    timeSpent: Optional[int] = None
    feedback: Optional[str] = None
    detailedResults: List[Dict[str, Any]] = []


# Endpoints pour les quiz

@router.get("/student/available", response_model=List[Dict[str, Any]])
async def get_student_available_quizzes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    course_id: Optional[int] = None,
    role: Optional[str] = None
):
    if current_user.role != "etudiant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=ACCESS_DENIED_STUDENTS
        )

    from app.models.models import Course, Lesson
    from app.models.quiz import Quiz as QuizModel
    from app.models.progress import UserQuizResult

    # Étape 1 : récupérer les cours inscrits
    enrolled_courses = db.query(Course).join(Course.students).filter(User.id == current_user.id).all()
    enrolled_course_ids = [c.id for c in enrolled_courses]

    if course_id is not None:
        if course_id not in enrolled_course_ids:
            raise HTTPException(status_code=403, detail="Vous n'êtes pas inscrit à ce cours")
        enrolled_course_ids = [course_id]

    # Étape 2 : récupérer les leçons
    lessons = db.query(Lesson).filter(Lesson.course_id.in_(enrolled_course_ids)).all()
    lesson_ids = [lesson.id for lesson in lessons]

    # Étape 3 : récupérer uniquement les quiz actifs (publiés)
    # Forcer le filtrage des quiz actifs uniquement
    quizzes = db.query(QuizModel).filter(
        QuizModel.lesson_id.in_(lesson_ids),
        QuizModel.is_active == True  # S'assurer que seuls les quiz actifs sont renvoyés
    ).all()
    
    # Journalisation pour le débogage
    print(f"Quiz actifs trouvés: {len(quizzes)}")
    for quiz in quizzes:
        print(f"- {quiz.title} (ID: {quiz.id}, Actif: {quiz.is_active})")

    # Étape 4 : récupérer les quiz déjà tentés pour afficher les statistiques
    attempted_quiz_results = {
        r.quiz_id: r for r in db.query(UserQuizResult).filter(UserQuizResult.user_id == current_user.id).all()
    }

    # Étape 5 : afficher TOUS les quiz publiés (tentés ou non)
    available_quizzes = []
    for quiz in quizzes:
        # Trouver leçon et cours liés
        lesson = next((l for l in lessons if l.id == quiz.lesson_id), None)
        course = next((c for c in enrolled_courses if c.id == lesson.course_id), None)
        
        # Vérifier si l'étudiant a déjà tenté ce quiz
        quiz_result = attempted_quiz_results.get(quiz.id)
        attempts = 1 if quiz_result else 0
        best_score = quiz_result.score if quiz_result else None
        last_attempt_date = quiz_result.completed_at.isoformat() if quiz_result and quiz_result.completed_at else None

        quiz_data = {
            "id": (quiz.id),
            "title": quiz.title,
            "description": quiz.description or "",
            "courseId": (lesson.course_id),
            "lessonId": (quiz.lesson_id),
            "isPublished": quiz.is_active,
            "passingScore": quiz.passing_score,
            "timeLimit": 30,
            "questions": get_quiz_questions(db, quiz.id),
            "settings": {
                "timeLimit": 30,
                "passingScore": quiz.passing_score,
                "showResults": True,
                "allowRetries": True,
                "shuffleQuestions": False,
                "shuffleAnswers": False
            },
            "metadata": {
                "courseName": course.title,
                "courseSlug": course.slug if hasattr(course, 'slug') else f"cours-{course.id}",
                "lessonName": lesson.title,
                "difficulty": "intermediate",
                "tags": [],
                "categories": []
            },
            "attempts": attempts,
            "bestScore": best_score,
            "lastAttemptDate": last_attempt_date,
            "isCompleted": quiz_result is not None,
            "isPassed": quiz_result.passed if quiz_result else False
        }

        available_quizzes.append(quiz_data)

    return available_quizzes

@router.get("/", response_model=List[Union[TeacherQuizResponse, StudentQuizResponse]])
async def get_all_quizzes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    course_id: Optional[int] = None
):
    """
    Récupère tous les quiz créés par l'enseignant.
    Peut être filtré par cours si course_id est fourni.
    """
    if current_user.role != "enseignant":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=ACCESS_DENIED_TEACHERS)
    
    # Importer les modèles nécessaires
    from app.models.quiz import Quiz as QuizModel
    from app.models.models import Lesson, Course
    
    print(f"Récupération des quiz pour l'enseignant {current_user.id}")
    
    # Requête avec jointures pour filtrer par enseignant
    query = db.query(QuizModel)\
        .join(Lesson, QuizModel.lesson_id == Lesson.id)\
        .join(Course, Lesson.course_id == Course.id)\
        .filter(Course.instructor_id == current_user.id)
    
    # Filtrer par cours si nécessaire
    if course_id:
        query = query.filter(Course.id == course_id)
    
    # Exécuter la requête
    db_quizzes = query.all()
    
    print(f"Nombre de quiz trouvés dans la base de données: {len(db_quizzes)}")
    
    # Si aucun quiz n'est trouvé dans la base de données, retourner une liste vide
    if not db_quizzes:
        print("Aucun quiz trouvé dans la base de données")
        return []
    
    # Convertir les modèles de base de données en format attendu par l'API
    result = []
    for db_quiz in db_quizzes:
        # S'assurer que les dates sont valides
        created_at = db_quiz.created_at if db_quiz.created_at else datetime.now()
        updated_at = db_quiz.updated_at if db_quiz.updated_at else datetime.now()
        
        quiz = {
            "id": db_quiz.id,
            "title": db_quiz.title,
            "description": db_quiz.description,
            "courseId": db_quiz.lesson_id,  # Utiliser lesson_id comme courseId
            "timeLimit": 30,  # Valeur par défaut
            "passingScore": db_quiz.passing_score,
            "dueDate": None,
            "isPublished": db_quiz.is_active,
            "createdAt": created_at,
            "updatedAt": updated_at,
            "questions": [],
            "submissionsCount": 0,
            "averageScore": None
        }
        result.append(quiz)
    
    return result

@router.get("/teacher", response_model=List[Union[TeacherQuizResponse, StudentQuizResponse]])
async def get_teacher_quizzes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    course_id: Optional[int] = None
):
    """
    Récupère tous les quiz créés par l'enseignant (endpoint spécifique pour le frontend).
    """
    return await get_all_quizzes(db, current_user, course_id)

@router.post("/", response_model=TeacherQuizResponse, status_code=status.HTTP_201_CREATED)
async def create_quiz(
    quiz: QuizCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Crée un nouveau quiz dans la base de données.
    """
    if current_user.role != "enseignant":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=ACCESS_DENIED_TEACHERS)
    
    # Importer les modèles SQLAlchemy
    from app.models.quiz import Quiz as QuizModel
    from app.models.quiz import QuizQuestion as QuizQuestionModel
    from app.models.quiz import QuizOption as QuizOptionModel
    from app.models.models import Lesson, Course
    
    # Vérifier que l'enseignant a des cours
    teacher_courses = db.query(Course).filter(Course.instructor_id == current_user.id).all()
    if not teacher_courses:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Vous devez avoir au moins un cours pour créer un quiz. Contactez l'administrateur pour vous assigner un cours."
        )
    
    # Vérifier que le cours appartient à l'enseignant
    course = db.query(Course)\
        .filter(Course.id == quiz.courseId)\
        .filter(Course.instructor_id == current_user.id)\
        .first()
    
    if not course:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez créer un quiz que pour vos propres cours."
        )
    
    # Chercher une leçon existante ou en créer une par défaut
    lesson = db.query(Lesson)\
        .filter(Lesson.course_id == quiz.courseId)\
        .first()
    
    if not lesson:
        # Créer une leçon par défaut pour le quiz
        lesson = Lesson(
            course_id=quiz.courseId,
            title=f"Leçon pour quiz: {quiz.title}",
            description=f"Leçon créée automatiquement pour le quiz '{quiz.title}'",
            content="",
            order_index=1,
            is_free=False
        )
        db.add(lesson)
        db.commit()
        db.refresh(lesson)
    
    # Créer un nouveau quiz dans la base de données
    # Forcer la publication automatique du quiz
    db_quiz = QuizModel(
        title=quiz.title,
        description=quiz.description,
        lesson_id=lesson.id,  # Utiliser l'ID de la leçon créée ou existante
        is_active=True,  # FORCER la publication automatique pour tous les quiz
        passing_score=quiz.passingScore
    )
    
    # S'assurer que le quiz est marqué comme publié même si isPublished est False
    quiz.isPublished = True
    
    # Ajouter le quiz à la base de données
    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)
    
    # Vérifier que chaque question a au moins une réponse correcte
    for i, question_data in enumerate(quiz.questions, 1):
        print(f"\n=== Traitement de la question {i} ===")
        print(f"Type de question: {question_data.type}")
        print(f"Options reçues: {[(opt.text, opt.isCorrect) for opt in question_data.options]}")
        
        if question_data.type in ['single', 'multiple']:
            # Vérifier si au moins une option est marquée comme correcte
            has_correct = any(opt.isCorrect for opt in question_data.options)
            print(f"Au moins une réponse correcte trouvée: {has_correct}")
            
            if not has_correct:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "message": f"La question '{question_data.text}' doit avoir au moins une réponse correcte",
                        "question_number": i,
                        "options_received": [{"text": opt.text, "isCorrect": opt.isCorrect} for opt in question_data.options]
                    }
                )
            
        db_question = QuizQuestionModel(
            quiz_id=db_quiz.id,
            question_text=question_data.text,
            question_type=question_data.type,
            points=1  # Valeur par défaut
        )
        
        db.add(db_question)
        db.commit()
        db.refresh(db_question)
        
        # Ajouter les options pour cette question
        for option_data in question_data.options:
            db_option = QuizOptionModel(
                question_id=db_question.id,
                option_text=option_data.text,
                is_correct=option_data.isCorrect
            )
            
            db.add(db_option)
        
        # Commit après avoir ajouté toutes les options
        db.commit()
    
    # Préparer la réponse
    # S'assurer que les dates sont valides
    created_at = db_quiz.created_at if db_quiz.created_at else datetime.now()
    updated_at = db_quiz.updated_at if db_quiz.updated_at else datetime.now()
    
    # Construire la réponse au format attendu par le frontend
    response = {
        "id": db_quiz.id,
        "title": db_quiz.title,
        "description": db_quiz.description,
        "courseId": db_quiz.lesson_id,
        "timeLimit": 30,  # Valeur par défaut
        "passingScore": db_quiz.passing_score,
        "dueDate": None,
        "isPublished": db_quiz.is_active,
        "createdAt": created_at,
        "updatedAt": updated_at,
        "questions": [],  # Les questions seront ajoutées par get_quiz
        "submissionsCount": 0,
        "averageScore": None
    }
    
    return response

@router.post("/{quiz_id}/submit")
async def submit_quiz_attempt(
    quiz_id: int,
    attempt: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Soumet une tentative de quiz et enregistre les résultats dans la base de données.
    """
    """
    Soumet une tentative de quiz et enregistre les résultats dans la base de données.
    """
    print(f"Soumission du quiz {quiz_id} par l'utilisateur {current_user.id}")
    print(f"Données de la tentative: {attempt}")
    
    # Récupérer le quiz avec ses questions et options pour calculer le score
    from app.models.quiz import Quiz as QuizModel
    from app.models.quiz import QuizQuestion as QuizQuestionModel
    from app.models.quiz import QuizOption as QuizOptionModel
    
    # Récupérer le quiz
    db_quiz = db.query(QuizModel).filter(QuizModel.id == quiz_id).first()
    if not db_quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quiz avec l'ID {quiz_id} non trouvé"
        )
    
    # Récupérer les questions et leurs options correctes
    questions = db.query(QuizQuestionModel).filter(QuizQuestionModel.quiz_id == quiz_id).all()
    
    # Dictionnaire pour stocker les réponses correctes
    correct_answers = {}
    
    for question in questions:
        # Récupérer les options correctes pour cette question
        correct_options = db.query(QuizOptionModel).filter(
            QuizOptionModel.question_id == question.id,
            QuizOptionModel.is_correct == True
        ).all()
        
        # Stocker les IDs des options correctes
        correct_answers[str(question.id)] = [str(opt.id) for opt in correct_options]
    
    # Calculer le score
    correct_count = 0
    for answer in attempt.get("answers", []):
        question_id = str(answer.get("questionId"))
        user_answer = answer.get("answer")
        
        # Pour les questions à choix unique
        if isinstance(user_answer, str):
            if question_id in correct_answers and user_answer in correct_answers[question_id]:
                correct_count += 1
        # Pour les questions à choix multiples
        elif isinstance(user_answer, list):
            if question_id in correct_answers:
                # Vérifier que toutes les réponses correctes sont sélectionnées et aucune incorrecte
                if set(user_answer) == set(correct_answers[question_id]):
                    correct_count += 1
    
    # Calculer le score en pourcentage
    score = (correct_count / len(questions)) * 100 if questions else 0
    
    # Déterminer si l'étudiant a réussi le quiz
    passed = score >= db_quiz.passing_score
    
    # Enregistrer le résultat dans la table user_quiz_results
    from sqlalchemy import text
    
    # Vérifier si un résultat existe déjà pour cet utilisateur et ce quiz
    existing_result = db.execute(
        text("SELECT id FROM user_quiz_results WHERE user_id = :user_id AND quiz_id = :quiz_id"),
        {"user_id": current_user.id, "quiz_id": quiz_id}
    ).fetchone()
    
    if existing_result:
        # Mettre à jour le résultat existant
        db.execute(
            text("UPDATE user_quiz_results SET score = :score, passed = :passed, completed_at = NOW() WHERE id = :id"),
            {"score": score, "passed": passed, "id": existing_result[0]}
        )
    else:
        # Insérer un nouveau résultat
        db.execute(
            text("INSERT INTO user_quiz_results (user_id, quiz_id, score, passed, completed_at) VALUES (:user_id, :quiz_id, :score, :passed, NOW())"),
            {"user_id": current_user.id, "quiz_id": quiz_id, "score": score, "passed": passed}
        )
    
    db.commit()
    
    # Sauvegarder les réponses individuelles dans user_quiz_answers
    from app.models.user_quiz_answers import UserQuizAnswer
    
    # Supprimer les anciennes réponses pour ce quiz et cet utilisateur
    db.query(UserQuizAnswer).filter(
        UserQuizAnswer.user_id == current_user.id,
        UserQuizAnswer.quiz_id == quiz_id
    ).delete()
    
    # Sauvegarder les nouvelles réponses
    for answer in attempt.get("answers", []):
        question_id = int(answer.get("questionId"))
        user_answer = answer.get("answer")
        
        # Déterminer si la réponse est correcte
        is_correct = False
        option_id = None
        answer_text = None
        
        if isinstance(user_answer, str):
            # Question à choix unique
            option_id = int(user_answer) if user_answer.isdigit() else None
            if str(question_id) in correct_answers and user_answer in correct_answers[str(question_id)]:
                is_correct = True
        elif isinstance(user_answer, list):
            # Question à choix multiples - prendre la première option pour option_id
            if user_answer:
                option_id = int(user_answer[0]) if str(user_answer[0]).isdigit() else None
                answer_text = ",".join(map(str, user_answer))
            if str(question_id) in correct_answers:
                is_correct = set(map(str, user_answer)) == set(correct_answers[str(question_id)])
        else:
            # Réponse textuelle
            answer_text = str(user_answer) if user_answer else None
        
        # Créer l'enregistrement UserQuizAnswer
        user_quiz_answer = UserQuizAnswer(
            user_id=current_user.id,
            quiz_id=quiz_id,
            question_id=question_id,
            option_id=option_id,
            answer_text=answer_text,
            is_correct=is_correct
        )
        
        db.add(user_quiz_answer)
    
    db.commit()
    
    # Préparer la réponse
    result = {
        "quizId": quiz_id,
        "userId": current_user.id,
        "score": score,
        "passed": passed,
        "correctAnswers": correct_count,
        "totalQuestions": len(questions),
        "completedAt": datetime.now().isoformat(),
        "timeSpent": attempt.get("timeSpent", 0)
    }
    
    return result

@router.patch("/{quiz_id}/publish")
async def toggle_quiz_publication(
    quiz_id: int,
    publish_data: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Publie ou dépublie un quiz existant.
    """
    if current_user.role != "enseignant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=ACCESS_DENIED_TEACHERS
        )
    
    from app.models.quiz import Quiz as QuizModel
    
    # Récupérer le quiz
    quiz = db.query(QuizModel).filter(QuizModel.id == quiz_id).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=QUIZ_NOT_FOUND
        )
    
    # Vérifier que le professeur a accès à ce quiz (via la leçon et le cours)
    from app.models.models import Course, Lesson
    lesson = db.query(Lesson).filter(Lesson.id == quiz.lesson_id).first()
    if lesson:
        course = db.query(Course).filter(Course.id == lesson.course_id).first()
        if course and course.teacher_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous n'avez pas accès à ce quiz"
            )
    
    # Mettre à jour le statut de publication
    is_published = publish_data.get("isPublished", not quiz.is_active)
    quiz.is_active = is_published
    
    db.commit()
    db.refresh(quiz)
    
    return {
        "id": quiz.id,
        "title": quiz.title,
        "isPublished": quiz.is_active,
        "message": f"Quiz {'publié' if quiz.is_active else 'dépublié'} avec succès"
    }

@router.get("/student/results")
async def get_student_quiz_results(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère tous les résultats de quiz pour l'étudiant connecté.
    Renvoie une réponse au format ApiResponse avec les données des résultats.
    """
    if current_user.role != "etudiant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail=ACCESS_DENIED_STUDENTS
        )
    
    try:
        # Récupérer les résultats depuis la table user_quiz_results
        from sqlalchemy import text
        
        results = db.execute(
            text("""
            SELECT uqr.id, uqr.quiz_id, q.title as quiz_title, uqr.score, uqr.passed, uqr.completed_at, 
                   l.title as lesson_title, c.title as course_title, c.id as course_id
            FROM user_quiz_results uqr
            JOIN quizzes q ON uqr.quiz_id = q.id
            JOIN lessons l ON q.lesson_id = l.id
            JOIN courses c ON l.course_id = c.id
            WHERE uqr.user_id = :user_id
            ORDER BY uqr.completed_at DESC
            """),
            {"user_id": current_user.id}
        ).fetchall()
        
        # Formater les résultats
        formatted_results = []
        for r in results:
            formatted_results.append({
                "id": r.id,
                "quizId": r.quiz_id,
                "quizTitle": r.quiz_title,
                "score": r.score,
                "passed": r.passed,
                "completedAt": r.completed_at.isoformat() if r.completed_at else None,
                "lessonTitle": r.lesson_title,
                "courseTitle": r.course_title,
                "courseId": r.course_id
            })
        
        # Retourner la réponse au format ApiResponse
        return {
            "data": formatted_results,
            "success": True,
            "message": "Résultats récupérés avec succès"
        }
        
    except Exception as e:
        # En cas d'erreur, retourner une réponse d'erreur structurée
        return {
            "data": [],
            "success": False,
            "error": {
                "code": "QUIZ_RESULTS_FETCH_ERROR",
                "message": f"Erreur lors de la récupération des résultats: {str(e)}"
            }
        }

@router.get("/{quiz_id}", response_model=Union[TeacherQuizResponse, StudentQuizResponse])
async def get_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Récupère un quiz spécifique par son ID.
    """
    """
    Récupère un quiz spécifique par son ID.
    """
    print(f"\n=== Début de la fonction get_quiz pour le quiz_id: {quiz_id} ===")
    print(f"Utilisateur actuel: {current_user.email} (ID: {current_user.id}, Rôle: {current_user.role})")
    
    try:
        # Importer les modèles nécessaires
        from app.models.quiz import Quiz as QuizModel
        from app.models.quiz import QuizQuestion as QuizQuestionModel
        from app.models.quiz import QuizOption as QuizOptionModel
        from sqlalchemy.orm import joinedload
        
        print(f"Recherche du quiz avec ID: {quiz_id} dans la base de données")
        
        # Récupérer le quiz avec ses questions et options
        db_quiz = db.query(QuizModel).filter(QuizModel.id == quiz_id).first()
        print(f"Résultat de la requête: {db_quiz}")
        
        if not db_quiz:
            print(f"Quiz avec ID {quiz_id} non trouvé dans la base de données, utilisation des données de démonstration")
            # Si non trouvé dans la BD, essayer les données de démonstration
            quiz = next((q for q in demo_quizzes if q["id"] == quiz_id), None)
            
            if not quiz:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Quiz avec l'ID {quiz_id} non trouvé"
                )
            return quiz
            
        print(f"Quiz trouvé dans la base de données: {db_quiz.title}")
        
        # Récupérer les questions du quiz
        questions = db.query(QuizQuestionModel).filter(QuizQuestionModel.quiz_id == db_quiz.id).all()
        print(f"Nombre de questions trouvées: {len(questions)}")
        
        # Convertir le modèle de base de données en format attendu par l'API
        created_at = db_quiz.created_at if db_quiz.created_at else datetime.now()
        updated_at = db_quiz.updated_at if db_quiz.updated_at else datetime.now()
        
        # Préparer les données du quiz
        quiz_data = {
            "id": db_quiz.id,
            "title": db_quiz.title,
            "description": db_quiz.description,
            "courseId": db_quiz.lesson_id,  # Utiliser lesson_id comme courseId
            "timeLimit": 30,  # Valeur par défaut
            "passingScore": db_quiz.passing_score,
            "dueDate": None,
            "isPublished": db_quiz.is_active,
            "createdAt": created_at,
            "updatedAt": updated_at,
            "questions": [],
            "submissionsCount": 0,
            "averageScore": None
        }
        
        # Ajouter les questions au quiz
        for question in questions:
            # Récupérer les options pour chaque question
            options = db.query(QuizOptionModel).filter(QuizOptionModel.question_id == question.id).all()
            
            # Créer les options avec le champ isCorrect
            question_options = []
            for option in options:
                question_options.append({
                    "id": str(option.id),
                    "text": option.option_text,
                    "isCorrect": option.is_correct if hasattr(option, 'is_correct') else False
                })
            
            # Ajouter la question avec ses options
            quiz_data["questions"].append({
                "id": str(question.id),
                "text": question.question_text,
                "type": question.question_type,
                "options": question_options
            })
        
        # Vérifier que l'utilisateur a le droit d'accéder à ce quiz
        if current_user.role == "enseignant":
            # L'enseignant peut voir tous les quiz qu'il a créés avec les bonnes réponses
            return TeacherQuizResponse(**quiz_data)
        elif current_user.role == "etudiant":
            # L'étudiant ne peut voir que les quiz publiés
            if not quiz_data["isPublished"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Vous n'êtes pas autorisé à accéder à ce quiz"
                )
            
            # Créer une copie profonde des données pour ne pas modifier l'original
            from copy import deepcopy
            student_quiz = deepcopy(quiz_data)
            
            # Pour chaque question, créer une nouvelle liste d'options sans le champ isCorrect
            for question in student_quiz["questions"]:
                question["options"] = [
                    {k: v for k, v in option.items() if k != "isCorrect"}
                    for option in question["options"]
                ]
            
            return StudentQuizResponse(**student_quiz)
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Rôle utilisateur non reconnu"
            )
            
    except HTTPException as he:
        # Relancer les exceptions HTTP telles quelles
        raise he
    except Exception as e:
        print(f"Erreur lors de la récupération du quiz: {str(e)}")
        print(f"Type d'erreur: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Une erreur est survenue lors de la récupération du quiz: {str(e)}"
        )



@router.put("/{quiz_id}", response_model=TeacherQuizResponse)
async def update_quiz(
    quiz_id: int,
    quiz_data: QuizUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Met à jour un quiz existant avec ses questions et options.
    
    Cette opération :
    - Met à jour les informations de base du quiz
    - Supprime les questions et options existantes
    - Crée les nouvelles questions et options
    
    Seuls les enseignants peuvent modifier des quiz.
    """
    # Vérifier que l'utilisateur est un enseignant
    if current_user.role != ROLE_TEACHER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=ACCESS_DENIED_TEACHERS
        )
    
    # Utiliser la transaction existante
    try:
        # Récupérer le quiz existant
        db_quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
        if not db_quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=QUIZ_NOT_FOUND
            )
        
        # Mettre à jour les champs de base du quiz
        db_quiz.title = quiz_data.title
        db_quiz.description = quiz_data.description
        # lessonId n'est pas dans le modèle QuizUpdate, on garde la valeur existante
        # db_quiz.lesson_id = quiz_data.lessonId
        db_quiz.passing_score = quiz_data.passingScore
        db_quiz.time_limit = quiz_data.timeLimit
        db_quiz.is_published = quiz_data.isPublished
        db_quiz.updated_at = datetime.utcnow()
        
        # Supprimer les questions et options existantes (cascade)
        db.query(models.QuizQuestion).filter(models.QuizQuestion.quiz_id == quiz_id).delete()
        
        # Ajouter les nouvelles questions
        for question_index, question in enumerate(quiz_data.questions):
            # Créer la question
            db_question = models.QuizQuestion(
                quiz_id=quiz_id,
                question_text=question.text,
                question_type=question.type,
                points=1  # Valeur par défaut, peut être modifiée si nécessaire
            )
            db.add(db_question)
            db.flush()  # Pour obtenir l'ID de la question
            
            # Ajouter les options de la question
            for option_index, option in enumerate(question.options):
                db_option = models.QuizOption(
                    question_id=db_question.id,
                    option_text=option.text,
                    is_correct=option.isCorrect
                )
                db.add(db_option)
        
        # Valider les changements
        db.commit()
        
        # Récupérer le quiz mis à jour pour le retour
        db.refresh(db_quiz)
        
        # Formater la réponse
        return {
            "id": db_quiz.id,
            "title": db_quiz.title,
            "description": db_quiz.description,
            "courseId": None,  # À implémenter si nécessaire avec une relation lesson
            "lessonId": db_quiz.lesson_id,
            "timeLimit": db_quiz.time_limit,
            "passingScore": db_quiz.passing_score,
            "isPublished": db_quiz.is_published,
            "questions": [
                {
                    "id": str(q.id),
                    "text": q.question_text,
                    "type": q.question_type,
                    "options": [
                        {
                            "id": str(o.id),
                            "text": o.option_text,
                            "isCorrect": o.is_correct
                        } for o in q.options
                    ]
                } for q in db_quiz.questions
            ],
            "createdAt": db_quiz.created_at,
            "updatedAt": db_quiz.updated_at,
            "submissionsCount": 0,  # À implémenter si nécessaire
            "averageScore": None    # À implémenter si nécessaire
        }
        
    except Exception as e:
        # En cas d'erreur, annuler la transaction
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Une erreur est survenue lors de la mise à jour du quiz: {str(e)}"
        )


@router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Supprime un quiz et toutes ses données associées de la base de données.
    
    Cette opération supprime de manière sécurisée :
    - Les questions du quiz
    - Les options de chaque question
    - Les résultats des utilisateurs pour ce quiz
    - Les réponses des utilisateurs pour ce quiz
    
    Seuls les enseignants peuvent supprimer des quiz.
    """
    if current_user.role != "enseignant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail=ACCESS_DENIED_TEACHERS
        )
    
    try:
        # 1. Vérifier si le quiz existe
        db_quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
        if not db_quiz:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail=QUIZ_NOT_FOUND
            )
        
        print(f"Début de la suppression du quiz {quiz_id}...")
        
        # 2. Supprimer d'abord les réponses des utilisateurs pour ce quiz
        answers_count = db.query(UserQuizAnswer).filter(
            UserQuizAnswer.quiz_id == quiz_id
        ).count()
        print(f"Suppression de {answers_count} réponses d'utilisateurs...")
        
        db.query(UserQuizAnswer).filter(
            UserQuizAnswer.quiz_id == quiz_id
        ).delete(synchronize_session=False)
        
        # 3. Supprimer les résultats des utilisateurs pour ce quiz
        results_count = db.query(UserQuizResult).filter(
            UserQuizResult.quiz_id == quiz_id
        ).count()
        print(f"Suppression de {results_count} résultats d'utilisateurs...")
        
        db.query(UserQuizResult).filter(
            UserQuizResult.quiz_id == quiz_id
        ).delete(synchronize_session=False)
        
        # 4. Récupérer les questions pour le log
        questions = db.query(models.QuizQuestion).filter(
            models.QuizQuestion.quiz_id == quiz_id
        ).all()
        print(f"Traitement de {len(questions)} questions...")
        
        # 5. Supprimer les options de chaque question du quiz
        for question in questions:
            options_count = db.query(models.QuizOption).filter(
                models.QuizOption.question_id == question.id
            ).count()
            print(f"Suppression de {options_count} options pour la question {question.id}...")
            
            db.query(models.QuizOption).filter(
                models.QuizOption.question_id == question.id
            ).delete(synchronize_session=False)
        
        # 6. Supprimer les questions du quiz
        db.query(models.QuizQuestion).filter(
            models.QuizQuestion.quiz_id == quiz_id
        ).delete(synchronize_session=False)
        
        # 7. Enfin, supprimer le quiz lui-même
        print(f"Suppression du quiz {quiz_id}...")
        db.delete(db_quiz)
        
        # Valider les changements
        db.commit()
        print("Suppression terminée avec succès.")
        
        # Retourner une réponse vide avec le code 204 (No Content)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
        
    except HTTPException as he:
        print(f"Erreur HTTP lors de la suppression: {str(he)}")
        db.rollback()
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Erreur lors de la suppression du quiz: {str(e)}\n{error_trace}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Une erreur est survenue lors de la suppression du quiz: {str(e)}"
        )

@router.post("/{quiz_id}/submit", response_model=QuizSubmissionResult)
async def submit_quiz(
    quiz_id: int,
    submission: QuizSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Soumet les réponses d'un étudiant à un quiz, enregistre les résultats dans la base de données
    et retourne les résultats détaillés.
    """
    if current_user.role != "etudiant":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux étudiants")
    
    # Vérifier que le quiz existe et est publié
    from app.models.quiz import Quiz, QuizQuestion, QuizOption, UserQuizResult, UserQuizAnswer
    
    # Récupérer le quiz avec ses questions et options
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.is_active == True  # Vérifier que le quiz est publié
    ).first()
    
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz non trouvé ou non publié")
    
    # Vérifier que l'utilisateur n'a pas déjà répondu à ce quiz
    existing_attempt = db.query(UserQuizResult).filter(
        UserQuizResult.user_id == current_user.id,
        UserQuizResult.quiz_id == quiz_id
    ).first()
    
    if existing_attempt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vous avez déjà répondu à ce quiz"
        )
    
    # Récupérer toutes les questions du quiz avec leurs options
    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz_id).all()
    
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce quiz ne contient aucune question"
        )
    
    total_questions = len(questions)
    correct_answers = 0
    detailed_results = []
    
    # Créer une entrée dans user_quiz_result
    quiz_result = UserQuizResult(
        user_id=current_user.id,
        quiz_id=quiz_id,
        score=0,  # Sera mis à jour après calcul
        is_passed=False,
        time_spent=submission.timeSpent or 0,
        submitted_at=datetime.now()
    )
    db.add(quiz_result)
    db.flush()  # Pour obtenir l'ID du résultat
    
    # Traiter chaque question
    for question in questions:
        # Trouver la réponse de l'étudiant pour cette question
        student_answer = next(
            (a for a in submission.answers if a.questionId == str(question.id)), 
            None
        )
        
        # Récupérer les options correctes pour cette question
        correct_options = db.query(QuizOption).filter(
            QuizOption.question_id == question.id,
            QuizOption.is_correct == True
        ).all()
        
        # Préparer le résultat détaillé
        question_result = {
            "questionId": str(question.id),
            "questionText": question.question_text,
            "isCorrect": False,
            "studentAnswer": None,
            "correctAnswer": None,
            "questionType": question.question_type
        }
        
        # Vérifier la réponse de l'étudiant
        if student_answer:
            student_answers = student_answer.answer
            if not isinstance(student_answers, list):
                student_answers = [student_answers]
            
            # Enregistrer la réponse de l'étudiant
            user_answer = UserQuizAnswer(
                user_quiz_result_id=quiz_result.id,
                question_id=question.id,
                answer_text=str(student_answers) if student_answers else None,
                is_correct=False  # Sera mis à jour après vérification
            )
            
            # Vérifier la réponse selon le type de question
            if question.question_type == "single":
                correct_option = next((o for o in correct_options), None)
                if correct_option:
                    question_result["correctAnswer"] = str(correct_option.id)
                    if student_answers and str(correct_option.id) in [str(a) for a in student_answers]:
                        correct_answers += 1
                        question_result["isCorrect"] = True
                        user_answer.is_correct = True
            
            elif question.question_type == "multiple":
                correct_option_ids = {str(o.id) for o in correct_options}
                student_option_ids = {str(a) for a in student_answers}
                question_result["correctAnswer"] = list(correct_option_ids)
                
                if student_option_ids == correct_option_ids:
                    correct_answers += 1
                    question_result["isCorrect"] = True
                    user_answer.is_correct = True
            
            elif question.question_type == "text":
                # Pour les questions textuelles, on considère que la réponse est correcte si elle correspond exactement
                # (dans une version plus avancée, on pourrait utiliser une comparaison plus souple)
                correct_text = question.correct_answer_text
                if correct_text and student_answers:
                    question_result["correctAnswer"] = correct_text
                    if student_answers[0].lower() == correct_text.lower():
                        correct_answers += 1
                        question_result["isCorrect"] = True
                        user_answer.is_correct = True
            
            db.add(user_answer)
        
        detailed_results.append(question_result)
    
    # Calculer le score final
    points_per_question = 100 / total_questions if total_questions > 0 else 0
    score = round(correct_answers * points_per_question, 2)
    is_passed = score >= quiz.passing_score
    
    # Mettre à jour le résultat du quiz avec le score final
    quiz_result.score = score
    quiz_result.is_passed = is_passed
    
    # Valider les changements dans la base de données
    db.commit()
    
    # Préparer la réponse
    result = {
        "id": quiz_result.id,
        "quizId": quiz_id,
        "studentId": current_user.id,
        "score": score,
        "isPassed": is_passed,
        "submittedAt": quiz_result.submitted_at,
        "timeSpent": quiz_result.time_spent,
        "feedback": "Félicitations !" if is_passed else "Continuez vos efforts !",
        "detailedResults": detailed_results
    }
    
    return result

@router.get("/{quiz_id}/results", response_model=List[Dict[str, Any]])
async def get_quiz_results(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère les résultats d'un quiz pour l'enseignant.
    """
    if current_user.role != "enseignant":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=ACCESS_DENIED_TEACHERS)
    
    # Dans une implémentation réelle, récupérer les résultats depuis la base de données
    # Ici, nous utilisons des données de démonstration
    quiz = next((q for q in demo_quizzes if q["id"] == quiz_id), None)
    
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz non trouvé")
    
    # Simuler des résultats
    results = [
        {
            "id": 1,
            "studentId": 101,
            "studentName": "Jean Dupont",
            "score": 85,
            "isPassed": True,
            "submittedAt": datetime.now() - timedelta(days=2, hours=3),
            "timeSpent": 1250  # en secondes
        },
        {
            "id": 2,
            "studentId": 102,
            "studentName": "Marie Martin",
            "score": 92,
            "isPassed": True,
            "submittedAt": datetime.now() - timedelta(days=2, hours=2),
            "timeSpent": 1100
        },
        {
            "id": 3,
            "studentId": 103,
            "studentName": "Lucas Bernard",
            "score": 58,
            "isPassed": False,
            "submittedAt": datetime.now() - timedelta(days=1, hours=5),
            "timeSpent": 1800
        }
    ]
    
    return results
@router.get("/student/history", response_model=List[Dict[str, Any]])
async def get_student_quiz_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    course_id: Optional[int] = None
):
    if current_user.role != "etudiant":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux étudiants")

    from app.models.models import Course, Lesson
    from app.models.quiz import Quiz as QuizModel
    from app.models.progress import UserQuizResult

    # Étape 1 : récupérer les cours auxquels l'étudiant est inscrit
    enrolled_courses = db.query(Course).join(Course.students).filter(User.id == current_user.id).all()
    enrolled_course_ids = [course.id for course in enrolled_courses]

    if course_id:
        if course_id not in enrolled_course_ids:
            raise HTTPException(status_code=403, detail="Vous n'êtes pas inscrit à ce cours")
        enrolled_course_ids = [course_id]

    # Étape 2 : récupérer les leçons
    lessons = db.query(Lesson).filter(Lesson.course_id.in_(enrolled_course_ids)).all()
    lesson_ids = [lesson.id for lesson in lessons]

    # Étape 3 : récupérer tous les quiz liés à ces leçons
    quizzes = db.query(QuizModel).filter(QuizModel.lesson_id.in_(lesson_ids)).all()
    quiz_dict = {quiz.id: quiz for quiz in quizzes}

    # Étape 4 : récupérer tous les résultats pour l'étudiant
    results = db.query(UserQuizResult).filter(UserQuizResult.user_id == current_user.id).all()

    history = []
    for result in results:
        quiz = quiz_dict.get(result.quiz_id)
        if not quiz:
            continue  # quiz supprimé ou pas dans les cours inscrits

        lesson = next((l for l in lessons if l.id == quiz.lesson_id), None)
        course = next((c for c in enrolled_courses if c.id == lesson.course_id), None)

        history.append({
            "id": result.id,
            "quizId": result.quiz_id,
            "quizTitle": quiz.title,
            "score": result.score,
            "passed": result.passed,
            "completedAt": result.completed_at.isoformat() if result.completed_at else None,
            "courseId": course.id,
            "courseTitle": course.title,
            "lessonId": lesson.id,
            "lessonTitle": lesson.title
        })

    return history
