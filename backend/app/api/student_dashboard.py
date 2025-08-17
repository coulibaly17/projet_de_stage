from fastapi import APIRouter
from .v1.endpoints import student_dashboard

router = APIRouter()
router.include_router(student_dashboard.router, tags=["Tableau de bord étudiant"])
