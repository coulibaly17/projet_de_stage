from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from .. import schemas, models
from ..database import get_db
from ..services.user_service import UserService
from ..services import auth_service

class UserStatusUpdate(BaseModel):
    active: bool

router = APIRouter()

@router.get("", response_model=List[schemas.User], include_in_schema=True)
@router.get("/", response_model=List[schemas.User], include_in_schema=False)
def read_users(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """
    Récupère une liste d'utilisateurs.
    Accessible à tous les utilisateurs authentifiés.
    """
    users = UserService.get_users(db, skip=skip, limit=limit)
    return users

@router.get("/me", response_model=schemas.User)
def read_user_me(
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """
    Récupère les informations de l'utilisateur actuellement connecté.
    """
    return current_user

@router.get("/{user_id}", response_model=schemas.User)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """
    Récupère un utilisateur par son ID.
    """
    # Seul un administrateur peut voir les profils des autres utilisateurs
    if user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas autorisé à accéder à ce profil"
        )
    
    db_user = UserService.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return db_user

@router.put("/{user_id}", response_model=schemas.User)
def update_user(
    user_id: int,
    user: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """
    Met à jour les informations d'un utilisateur.
    """
    return UserService.update_user(db, user_id=user_id, user_update=user, current_user=current_user)

@router.get("/me/progress", response_model=schemas.LearningStats)
def get_user_progress(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """
    Récupère les statistiques de progression de l'utilisateur connecté.
    """
    return UserService.get_user_progress(db, user_id=current_user.id)

@router.patch("/{user_id}/status", response_model=dict, status_code=status.HTTP_200_OK)
def update_user_status(
    user_id: int,
    status_update: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """
    Active ou désactive un utilisateur (réservé aux administrateurs).
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Action non autorisée. Seul un administrateur peut modifier le statut d'un utilisateur."
        )
    
    try:
        db_user = db.query(models.User).filter(models.User.id == user_id).first()
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )
            
        # Mettre à jour le statut de l'utilisateur
        db_user.is_active = status_update.active
        db.commit()
        db.refresh(db_user)
        
        return {
            "success": True,
            "message": f"L'utilisateur a été {'activé' if status_update.active else 'désactivé'} avec succès",
            "is_active": db_user.is_active
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Une erreur est survenue lors de la mise à jour du statut de l'utilisateur: {str(e)}"
        )

@router.delete("/{user_id}", response_model=dict, status_code=status.HTTP_200_OK)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_service.get_current_active_user)
):
    """
    Désactive un utilisateur (réservé aux administrateurs).
    Pour les enseignants, conserve leurs cours mais les empêche de se connecter.
    """
    try:
        result = UserService.delete_user(db, user_id=user_id, current_user=current_user)
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Une erreur est survenue lors de la désactivation de l'utilisateur: {str(e)}"
        )
