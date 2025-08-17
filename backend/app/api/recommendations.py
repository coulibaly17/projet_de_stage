from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from .. import schemas, models
from ..database import get_db
from ..services import auth_service, recommendation_service, interaction_service

router = APIRouter()

@router.get("/content-based", response_model=List[Dict[str, Any]])
async def get_content_based_recommendations(
    request: Request,
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """
    Récupère des recommandations basées sur le contenu des cours que l'utilisateur a déjà suivis.
    """
    # Enregistre l'accès à la page de recommandations
    interaction_svc = interaction_service.InteractionService(db)
    interaction_svc.log_interaction(
        user_id=current_user.id,
        entity_type='page',
        entity_id=0,
        interaction_type='view',
        metadata={
            'path': str(request.url.path),
            'params': dict(request.query_params)
        }
    )
    
    # Récupère les recommandations
    recommender = recommendation_service.RecommendationService(db)
    recommendations = recommender.get_content_based_recommendations(
        user_id=current_user.id,
        limit=limit
    )
    
    # Formate la réponse
    return [{
        "course": schemas.Course.from_orm(rec["course"]),
        "score": rec["score"],
        "reason": rec.get("reason", "Basé sur vos centres d'intérêt")
    } for rec in recommendations]

@router.get("/collaborative", response_model=List[Dict[str, Any]])
def get_collaborative_recommendations(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """
    Récupère des recommandations basées sur le comportement d'utilisateurs similaires.
    """
    recommender = recommendation_service.RecommendationService(db)
    recommendations = recommender.get_collaborative_filtering_recommendations(
        user_id=current_user.id,
        limit=limit
    )
    
    # Formate la réponse
    return [{
        "course": schemas.Course.from_orm(rec["course"]),
        "score": rec["score"],
        "reason": rec.get("reason", "Recommandé par des utilisateurs similaires")
    } for rec in recommendations]

@router.get("/hybrid", response_model=List[Dict[str, Any]])
def get_hybrid_recommendations(
    limit: int = 5,
    content_weight: float = 0.5,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """
    Récupère des recommandations combinant les approches basées sur le contenu et collaboratives.
    
    Args:
        limit: Nombre maximum de recommandations à retourner
        content_weight: Poids des recommandations basées sur le contenu (entre 0 et 1)
    """
    if not 0 <= content_weight <= 1:
        raise HTTPException(
            status_code=400,
            detail="Le poids du contenu doit être compris entre 0 et 1"
        )
    
    recommender = recommendation_service.RecommendationService(db)
    recommendations = recommender.get_hybrid_recommendations(
        user_id=current_user.id,
        limit=limit,
        content_weight=content_weight
    )
    
    # Formate la réponse
    return [{
        "course": schemas.Course.from_orm(rec["course"]),
        "score": rec["hybrid_score"],
        "reason": rec.get("reason", "Recommandé pour vous"),
        "content_score": rec.get("content_score", 0),
        "collab_score": rec.get("collab_score", 0)
    } for rec in recommendations]

@router.get("/popular", response_model=List[Dict[str, Any]])
def get_popular_courses(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """
    Récupère les cours les plus populaires.
    """
    recommender = recommendation_service.RecommendationService(db)
    recommendations = recommender.get_popular_courses(limit=limit)
    
    # Formate la réponse
    return [{
        "course": schemas.Course.from_orm(rec["course"]),
        "score": rec["score"],
        "reason": rec.get("reason", "Cours populaire")
    } for rec in recommendations]
