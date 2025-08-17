from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from . import models, schemas
from .database import engine, get_db
from .config import settings
from .middleware.tracking import PageViewTrackingMiddleware

# Création des tables dans la base de données
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="API pour la plateforme éducative intelligente",
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],  # Autoriser explicitement le frontend
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*", "Authorization", "Content-Type"],  # Autoriser explicitement les en-têtes d'authentification
    expose_headers=["*"],
)

# Middleware de suivi des pages vues
app.add_middleware(PageViewTrackingMiddleware)

# Schéma d'authentification
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token")

# Route racine
@app.get("/")
async def root():
    return {
        "message": "Bienvenue sur l'API de la plateforme éducative intelligente",
        "version": settings.VERSION,
        "documentation": "/docs"
    }

# Importer les routes API
from .api import users, courses, auth, recommendations, interactions, student_dashboard, teacher_dashboard

# Ajouter des logs pour déboguer
import sys
print("Chemins Python:", sys.path)
print("Tentative d'importation de teacher_courses...")

try:
    from .api.v1.endpoints import (
        quiz, assignment, discussion, recommendation, 
        teacher_courses, progress, courses as courses_v1, 
        student_courses, enrollments
    )
    print("Import des modules API réussi!")
    print("Routes disponibles dans teacher_courses:", [route.path for route in teacher_courses.router.routes])
except Exception as e:
    print("Erreur lors de l'importation des modules API:", str(e))
    # Fallback à l'ancien import
    from .api.v1.endpoints import quiz, assignment, discussion, recommendation, courses as teacher_courses
    from .api.v1.endpoints import courses as courses_v1
    # Importer les routeurs séparément pour éviter les conflits
    from .api.v1.endpoints.progress import router as progress_router
    from .api.v1.endpoints import student_courses, enrollments
    print("Fallback à l'importation de base des modules API")
else:
    # Importer le routeur de progression normalement si le premier import a réussi
    from .api.v1.endpoints.progress import router as progress_router

# Inclure les routeurs
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentification"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Utilisateurs"])
# app.include_router(courses.router, prefix="/api/v1/courses", tags=["Cours"])
app.include_router(courses_v1.router, prefix="/api/v1/courses", tags=["Cours V1"])
app.include_router(recommendations.router, prefix="/api/v1/recommendations", tags=["Recommandations"])
app.include_router(interactions.router, prefix="/api/v1/interactions", tags=["Interactions"])
app.include_router(student_dashboard.router, prefix="/api/v1/student", tags=["Tableau de bord étudiant"])
app.include_router(teacher_dashboard.router, prefix="/api/v1/teacher", tags=["Tableau de bord enseignant"])

# Inclure les nouveaux routeurs
app.include_router(quiz.router, prefix="/api/v1/quizzes", tags=["Quiz"])
app.include_router(assignment.router, prefix="/api/v1/assignments", tags=["Devoirs"])
app.include_router(discussion.router, prefix="/api/v1/discussions", tags=["Discussions"])
app.include_router(recommendation.router, prefix="/api/v1/recommendations/new", tags=["Nouvelles Recommandations"])
app.include_router(teacher_courses.router, prefix="/api/v1/teacher/dashboard/courses", tags=["Cours Enseignant"])

# Routeur pour la progression des étudiants
app.include_router(progress_router, prefix="/api/v1/progress", tags=["Progression des étudiants"])

# Routeur pour les cours des étudiants
app.include_router(student_courses.router, prefix="/api/v1/student/courses", tags=["Cours Étudiant"])

# Routeur pour les inscriptions aux cours
app.include_router(enrollments.router, prefix="/api/v1", tags=["Inscriptions"])

from fastapi.responses import JSONResponse
from fastapi import status

# Gestion des erreurs
@app.exception_handler(404)
async def not_found_exception_handler(request, exc):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": "Ressource non trouvée"}
    )

# Gestionnaire d'erreurs global
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    # Journaliser l'erreur pour le débogage
    import traceback
    print(f"Erreur non gérée: {str(exc)}")
    traceback.print_exc()
    
    # Retourner une réponse JSON avec le code d'erreur 500
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Une erreur interne est survenue"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
