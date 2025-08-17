from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Query, status
from sqlalchemy.orm import Session
from pydantic import HttpUrl

from .. import models, schemas
from ..database import get_db
from ..services import auth_service, interaction_service
from ..schemas.interaction import EntityType, InteractionType, UserInteractionStats

router = APIRouter(prefix="/interactions", tags=["interactions"])

@router.post(
    "/track", 
    response_model=schemas.UserInteraction,
    status_code=status.HTTP_201_CREATED,
    summary="Enregistrer une interaction utilisateur",
    description="""
    Enregistre une interaction utilisateur telle qu'une vue de page, un clic, 
    une complétion, etc. avec des métadonnées optionnelles.
    """
)
async def track_interaction(
    interaction: schemas.InteractionCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """
    Enregistre une interaction utilisateur (vue, clic, complétion, etc.)
    """
    service = interaction_service.InteractionService(db)
    
    # Ajoute des métadonnées supplémentaires
    metadata = interaction.metadata or {}
    metadata.update({
        'user_agent': request.headers.get('user-agent'),
        'ip_address': request.client.host if request.client else None,
        'referer': request.headers.get('referer')
    })
    
    try:
        # Enregistre l'interaction
        interaction = service.log_interaction(
            user_id=current_user.id,
            entity_type=interaction.entity_type.value,
            entity_id=interaction.entity_id,
            interaction_type=interaction.interaction_type.value,
            metadata=metadata
        )
        return interaction
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Une erreur est survenue lors de l'enregistrement de l'interaction")

@router.get(
    "/user/recent", 
    response_model=schemas.PaginatedResponse[schemas.UserInteraction],
    summary="Récupérer les interactions récentes de l'utilisateur"
)
async def get_user_interactions(
    entity_type: Optional[EntityType] = Query(
        None, 
        description="Filtrer par type d'entité (course, lesson, quiz, etc.)"
    ),
    interaction_type: Optional[InteractionType] = Query(
        None, 
        description="Filtrer par type d'interaction (view, click, complete, etc.)"
    ),
    entity_id: Optional[int] = Query(
        None,
        description="Filtrer par ID d'entité spécifique"
    ),
    start_date: Optional[datetime] = Query(
        None,
        description="Date de début pour le filtre (inclus)"
    ),
    end_date: Optional[datetime] = Query(
        None,
        description="Date de fin pour le filtre (inclus)"
    ),
    page: int = Query(1, ge=1, description="Numéro de page"),
    limit: int = Query(20, ge=1, le=100, description="Nombre d'éléments par page"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """
    Récupère les interactions de l'utilisateur avec pagination et filtres optionnels
    """
    service = interaction_service.InteractionService(db)
    offset = (page - 1) * limit
    
    interactions, total = service.get_user_interactions(
        user_id=current_user.id,
        entity_type=entity_type,
        interaction_type=interaction_type,
        entity_id=entity_id,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset
    )
    
    return {
        "items": interactions,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 1
    }

@router.get(
    "/user/stats",
    response_model=UserInteractionStats,
    summary="Récupérer les statistiques d'interaction de l'utilisateur"
)
async def get_user_interaction_stats(
    days: int = Query(30, ge=1, le=365, description="Nombre de jours à inclure dans les statistiques"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """
    Récupère des statistiques sur les interactions de l'utilisateur
    """
    service = interaction_service.InteractionService(db)
    return service.get_user_stats(user_id=current_user.id, days=days)

@router.get(
    "/user/has-interacted",
    response_model=bool,
    summary="Vérifier si l'utilisateur a interagi avec une entité"
)
async def has_interacted_with(
    entity_type: EntityType = Query(..., description="Type d'entité"),
    entity_id: int = Query(..., description="ID de l'entité"),
    interaction_type: Optional[InteractionType] = Query(
        None, 
        description="Type d'interaction spécifique à vérifier"
    ),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """
    Vérifie si l'utilisateur a déjà interagi avec une entité spécifique
    """
    service = interaction_service.InteractionService(db)
    return service.has_interacted_with(
        user_id=current_user.id,
        entity_type=entity_type,
        entity_id=entity_id,
        interaction_type=interaction_type
    )
