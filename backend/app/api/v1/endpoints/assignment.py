from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.services.auth_service import get_current_active_user
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
import uuid

router = APIRouter()

# Schémas Pydantic pour les devoirs
class AssignmentBase(BaseModel):
    title: str
    description: str
    courseId: int
    dueDate: Optional[datetime] = None
    maxPoints: int = 100
    isPublished: bool = False

class AssignmentCreate(AssignmentBase):
    attachments: List[str] = []

class AssignmentUpdate(AssignmentBase):
    id: int
    attachments: List[str] = []

class AssignmentResponse(AssignmentBase):
    id: int
    createdAt: datetime
    updatedAt: datetime
    attachments: List[str] = []
    submissionsCount: int = 0
    gradedCount: int = 0
    averageGrade: Optional[float] = None

class AssignmentSubmission(BaseModel):
    assignmentId: int
    comment: Optional[str] = None
    attachmentUrls: List[str] = []

class AssignmentSubmissionResponse(BaseModel):
    id: int
    assignmentId: int
    studentId: int
    studentName: str
    submittedAt: datetime
    comment: Optional[str] = None
    attachmentUrls: List[str] = []
    grade: Optional[float] = None
    feedback: Optional[str] = None
    gradedAt: Optional[datetime] = None
    gradedBy: Optional[str] = None

class AssignmentGrade(BaseModel):
    grade: float
    feedback: Optional[str] = None

# Données de démonstration pour les devoirs
demo_assignments = [
    {
        "id": 1,
        "title": "Analyse de données statistiques",
        "description": "Réalisez une analyse complète du jeu de données fourni en utilisant les techniques vues en cours.",
        "courseId": 1,
        "dueDate": datetime.now() + timedelta(days=1),
        "maxPoints": 100,
        "isPublished": True,
        "createdAt": datetime.now() - timedelta(days=14),
        "updatedAt": datetime.now() - timedelta(days=14),
        "attachments": ["dataset_statistiques.csv", "consignes_analyse.pdf"],
        "submissionsCount": 15,
        "gradedCount": 8,
        "averageGrade": 78
    },
    {
        "id": 2,
        "title": "Implémentation d'un algorithme de tri",
        "description": "Implémentez les algorithmes de tri quicksort et mergesort, et comparez leurs performances.",
        "courseId": 2,
        "dueDate": datetime.now() + timedelta(days=3),
        "maxPoints": 100,
        "isPublished": True,
        "createdAt": datetime.now() - timedelta(days=21),
        "updatedAt": datetime.now() - timedelta(days=21),
        "attachments": ["template_code.py", "jeux_de_test.zip"],
        "submissionsCount": 12,
        "gradedCount": 12,
        "averageGrade": 85
    },
    {
        "id": 3,
        "title": "Résumé du chapitre 5",
        "description": "Rédigez un résumé analytique du chapitre 5 en mettant en évidence les thèmes principaux.",
        "courseId": 3,
        "dueDate": datetime.now() + timedelta(days=5),
        "maxPoints": 50,
        "isPublished": False,
        "createdAt": datetime.now() - timedelta(days=1),
        "updatedAt": datetime.now() - timedelta(days=1),
        "attachments": [],
        "submissionsCount": 0,
        "gradedCount": 0,
        "averageGrade": None
    }
]

# Données de démonstration pour les soumissions
demo_submissions = [
    {
        "id": 1,
        "assignmentId": 1,
        "studentId": 101,
        "studentName": "Jean Dupont",
        "submittedAt": datetime.now() - timedelta(days=3),
        "comment": "Voici mon analyse des données statistiques. J'ai utilisé Python et pandas pour l'analyse.",
        "attachmentUrls": ["analyse_jean_dupont.pdf", "code_analyse.py"],
        "grade": 85,
        "feedback": "Très bonne analyse. La visualisation pourrait être améliorée.",
        "gradedAt": datetime.now() - timedelta(days=1),
        "gradedBy": "Dr. Sophie Martin"
    },
    {
        "id": 2,
        "assignmentId": 1,
        "studentId": 102,
        "studentName": "Marie Martin",
        "submittedAt": datetime.now() - timedelta(days=4),
        "comment": "J'ai réalisé l'analyse en utilisant R et ggplot2.",
        "attachmentUrls": ["analyse_marie_martin.pdf", "script_r.R"],
        "grade": 92,
        "feedback": "Excellent travail, analyse approfondie et visualisations claires.",
        "gradedAt": datetime.now() - timedelta(days=1),
        "gradedBy": "Dr. Sophie Martin"
    },
    {
        "id": 3,
        "assignmentId": 1,
        "studentId": 103,
        "studentName": "Lucas Bernard",
        "submittedAt": datetime.now() - timedelta(days=2),
        "comment": "Voici mon analyse. J'ai eu quelques difficultés avec la partie ANOVA.",
        "attachmentUrls": ["analyse_lucas_bernard.pdf"],
        "grade": None,
        "feedback": None,
        "gradedAt": None,
        "gradedBy": None
    }
]

# Endpoints pour les devoirs

@router.get("/", response_model=List[AssignmentResponse])
async def get_all_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    course_id: Optional[int] = None
):
    """
    Récupère tous les devoirs créés par l'enseignant.
    Peut être filtré par cours si course_id est fourni.
    """
    if current_user.role != "enseignant":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux enseignants")
    
    # Dans une implémentation réelle, filtrer les devoirs depuis la base de données
    # Ici, nous utilisons des données de démonstration
    assignments = demo_assignments
    
    if course_id:
        assignments = [assignment for assignment in assignments if assignment["courseId"] == course_id]
    
    return assignments

@router.post("/", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    assignment: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Crée un nouveau devoir.
    """
    if current_user.role != "enseignant":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux enseignants")
    
    # Dans une implémentation réelle, sauvegarder le devoir dans la base de données
    # Ici, nous simulons la création
    new_assignment = {
        "id": len(demo_assignments) + 1,
        **assignment.dict(),
        "createdAt": datetime.now(),
        "updatedAt": datetime.now(),
        "submissionsCount": 0,
        "gradedCount": 0,
        "averageGrade": None
    }
    
    demo_assignments.append(new_assignment)
    
    return new_assignment

@router.get("/{assignment_id}", response_model=AssignmentResponse)
async def get_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère un devoir spécifique par son ID.
    """
    # Dans une implémentation réelle, récupérer le devoir depuis la base de données
    # Ici, nous utilisons des données de démonstration
    assignment = next((a for a in demo_assignments if a["id"] == assignment_id), None)
    
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Devoir non trouvé")
    
    # Vérifier que l'utilisateur a le droit d'accéder à ce devoir
    if current_user.role == "enseignant":
        # L'enseignant peut voir tous les devoirs qu'il a créés
        return assignment
    elif current_user.role == "etudiant":
        # L'étudiant ne peut voir que les devoirs publiés
        if assignment["isPublished"]:
            return assignment
        else:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ce devoir n'est pas encore publié")
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès non autorisé")

@router.put("/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(
    assignment_id: int,
    assignment_update: AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Met à jour un devoir existant.
    """
    if current_user.role != "enseignant":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux enseignants")
    
    # Dans une implémentation réelle, mettre à jour le devoir dans la base de données
    # Ici, nous simulons la mise à jour
    assignment_index = next((i for i, a in enumerate(demo_assignments) if a["id"] == assignment_id), None)
    
    if assignment_index is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Devoir non trouvé")
    
    updated_assignment = {
        **demo_assignments[assignment_index],
        **assignment_update.dict(),
        "updatedAt": datetime.now()
    }
    
    demo_assignments[assignment_index] = updated_assignment
    
    return updated_assignment

@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Supprime un devoir.
    """
    if current_user.role != "enseignant":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux enseignants")
    
    # Dans une implémentation réelle, supprimer le devoir de la base de données
    # Ici, nous simulons la suppression
    assignment_index = next((i for i, a in enumerate(demo_assignments) if a["id"] == assignment_id), None)
    
    if assignment_index is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Devoir non trouvé")
    
    demo_assignments.pop(assignment_index)
    
    return None

@router.post("/{assignment_id}/submit", response_model=AssignmentSubmissionResponse)
async def submit_assignment(
    assignment_id: int,
    submission: AssignmentSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Soumet un devoir par un étudiant.
    """
    if current_user.role != "etudiant":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux étudiants")
    
    # Dans une implémentation réelle, vérifier que le devoir existe et est publié
    assignment = next((a for a in demo_assignments if a["id"] == assignment_id), None)
    
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Devoir non trouvé")
    
    if not assignment["isPublished"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ce devoir n'est pas disponible")
    
    # Vérifier si la date limite est dépassée
    if assignment["dueDate"] and datetime.now() > assignment["dueDate"]:
        # Dans une implémentation réelle, on pourrait autoriser les soumissions en retard
        # avec une pénalité ou un marquage spécial
        pass
    
    # Simuler la création d'une soumission
    new_submission = {
        "id": len(demo_submissions) + 1,
        "assignmentId": assignment_id,
        "studentId": current_user.id,
        "studentName": f"{current_user.first_name} {current_user.last_name}",
        "submittedAt": datetime.now(),
        "comment": submission.comment,
        "attachmentUrls": submission.attachmentUrls,
        "grade": None,
        "feedback": None,
        "gradedAt": None,
        "gradedBy": None
    }
    
    demo_submissions.append(new_submission)
    
    # Mettre à jour le compteur de soumissions
    for a in demo_assignments:
        if a["id"] == assignment_id:
            a["submissionsCount"] += 1
    
    return new_submission

@router.post("/{assignment_id}/upload", response_model=Dict[str, str])
async def upload_assignment_file(
    assignment_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Télécharge un fichier pour un devoir.
    """
    # Dans une implémentation réelle, sauvegarder le fichier dans un stockage
    # et retourner l'URL du fichier
    
    # Simuler le téléchargement
    file_url = f"uploads/{assignment_id}/{file.filename}"
    
    return {"fileUrl": file_url}

@router.get("/{assignment_id}/submissions", response_model=List[AssignmentSubmissionResponse])
async def get_assignment_submissions(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère toutes les soumissions pour un devoir spécifique.
    Accessible uniquement par l'enseignant.
    """
    if current_user.role != "enseignant":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux enseignants")
    
    # Dans une implémentation réelle, récupérer les soumissions depuis la base de données
    # Ici, nous utilisons des données de démonstration
    submissions = [s for s in demo_submissions if s["assignmentId"] == assignment_id]
    
    return submissions

@router.get("/{assignment_id}/submissions/{submission_id}", response_model=AssignmentSubmissionResponse)
async def get_submission(
    assignment_id: int,
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère une soumission spécifique.
    """
    # Dans une implémentation réelle, récupérer la soumission depuis la base de données
    # Ici, nous utilisons des données de démonstration
    submission = next((s for s in demo_submissions if s["id"] == submission_id and s["assignmentId"] == assignment_id), None)
    
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Soumission non trouvée")
    
    # Vérifier que l'utilisateur a le droit d'accéder à cette soumission
    if current_user.role == "enseignant":
        # L'enseignant peut voir toutes les soumissions
        return submission
    elif current_user.role == "etudiant" and submission["studentId"] == current_user.id:
        # L'étudiant ne peut voir que ses propres soumissions
        return submission
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès non autorisé")

@router.post("/{assignment_id}/submissions/{submission_id}/grade", response_model=AssignmentSubmissionResponse)
async def grade_submission(
    assignment_id: int,
    submission_id: int,
    grade_data: AssignmentGrade,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Note une soumission de devoir.
    """
    if current_user.role != "enseignant":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux enseignants")
    
    # Dans une implémentation réelle, mettre à jour la soumission dans la base de données
    # Ici, nous simulons la mise à jour
    submission_index = next((i for i, s in enumerate(demo_submissions) if s["id"] == submission_id and s["assignmentId"] == assignment_id), None)
    
    if submission_index is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Soumission non trouvée")
    
    # Mettre à jour la soumission avec la note
    demo_submissions[submission_index]["grade"] = grade_data.grade
    demo_submissions[submission_index]["feedback"] = grade_data.feedback
    demo_submissions[submission_index]["gradedAt"] = datetime.now()
    demo_submissions[submission_index]["gradedBy"] = f"{current_user.first_name} {current_user.last_name}"
    
    # Mettre à jour les statistiques du devoir
    assignment_index = next((i for i, a in enumerate(demo_assignments) if a["id"] == assignment_id), None)
    if assignment_index is not None:
        demo_assignments[assignment_index]["gradedCount"] += 1
        
        # Recalculer la moyenne des notes
        graded_submissions = [s for s in demo_submissions if s["assignmentId"] == assignment_id and s["grade"] is not None]
        if graded_submissions:
            average_grade = sum(s["grade"] for s in graded_submissions) / len(graded_submissions)
            demo_assignments[assignment_index]["averageGrade"] = average_grade
    
    return demo_submissions[submission_index]

@router.get("/student/assignments", response_model=List[Dict[str, Any]])
async def get_student_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    status: Optional[str] = None
):
    """
    Récupère tous les devoirs disponibles pour l'étudiant.
    Peut être filtré par statut (pending, submitted, graded, late).
    """
    if current_user.role != "etudiant":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux étudiants")
    
    # Dans une implémentation réelle, récupérer les devoirs depuis la base de données
    # Ici, nous utilisons des données de démonstration
    
    # Récupérer tous les devoirs publiés
    available_assignments = [a for a in demo_assignments if a["isPublished"]]
    
    # Récupérer les soumissions de l'étudiant
    student_submissions = [s for s in demo_submissions if s["studentId"] == current_user.id]
    
    # Préparer la liste des devoirs avec leur statut pour l'étudiant
    student_assignments = []
    
    for assignment in available_assignments:
        # Trouver la soumission de l'étudiant pour ce devoir, s'il y en a une
        submission = next((s for s in student_submissions if s["assignmentId"] == assignment["id"]), None)
        
        assignment_status = "pending"
        if submission:
            if submission["grade"] is not None:
                assignment_status = "graded"
            else:
                assignment_status = "submitted"
        elif assignment["dueDate"] and datetime.now() > assignment["dueDate"]:
            assignment_status = "late"
        
        # Si un filtre de statut est spécifié, ignorer les devoirs qui ne correspondent pas
        if status and assignment_status != status:
            continue
        
        student_assignment = {
            "id": assignment["id"],
            "title": assignment["title"],
            "courseTitle": f"Cours {assignment['courseId']}",  # Dans une implémentation réelle, récupérer le titre du cours
            "courseId": assignment["courseId"],
            "dueDate": assignment["dueDate"].strftime("%d/%m/%Y %H:%M") if assignment["dueDate"] else None,
            "status": assignment_status
        }
        
        if submission:
            student_assignment["submissionDate"] = submission["submittedAt"].strftime("%d/%m/%Y %H:%M")
            if submission["grade"] is not None:
                student_assignment["grade"] = submission["grade"]
                student_assignment["feedback"] = submission["feedback"]
        
        student_assignments.append(student_assignment)
    
    return student_assignments
