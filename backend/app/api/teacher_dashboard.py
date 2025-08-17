from fastapi import APIRouter
from .v1.endpoints import teacher_dashboard

router = APIRouter()
router.include_router(teacher_dashboard.router, prefix="/dashboard", tags=["Tableau de bord enseignant"])
