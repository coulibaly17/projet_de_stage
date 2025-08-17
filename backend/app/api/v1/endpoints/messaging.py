from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps
from app.services.messaging_service import MessageService, DiscussionService
from app.schemas.messaging import (
    MessageCreate, DiscussionCreate, DiscussionUpdate,
    DiscussionInList, DiscussionWithMessages, PaginatedMessages
)

router = APIRouter()

# Endpoints pour les discussions
@router.post("/discussions/", response_model=schemas.Discussion, status_code=status.HTTP_201_CREATED)
def create_discussion(
    discussion_in: DiscussionCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Créer une nouvelle discussion
    """
    try:
        discussion, _ = DiscussionService.create_discussion(
            db=db,
            discussion_in=discussion_in,
            creator_id=current_user.id
        )
        return discussion
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/discussions/", response_model=List[DiscussionInList])
def list_discussions(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    skip: int = 0,
    limit: int = 100,
):
    """
    Récupérer la liste des discussions de l'utilisateur
    """
    result = DiscussionService.get_user_discussions(
        db=db,
        user_id=current_user.id,
        page=(skip // limit) + 1,
        page_size=limit
    )
    return result.items

@router.get("/discussions/{discussion_id}", response_model=DiscussionWithMessages)
def get_discussion(
    discussion_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Récupérer une discussion avec ses messages
    """
    discussion = DiscussionService.get_discussion(
        db=db,
        discussion_id=discussion_id,
        user_id=current_user.id
    )
    
    if not discussion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Discussion non trouvée ou accès refusé"
        )
    
    return discussion

@router.put("/discussions/{discussion_id}", response_model=schemas.Discussion)
def update_discussion(
    discussion_id: int,
    discussion_in: DiscussionUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Mettre à jour une discussion
    """
    # Vérifier que l'utilisateur est le créateur de la discussion
    discussion = db.query(models.Discussion).filter(
        models.Discussion.id == discussion_id,
        models.Discussion.created_by == current_user.id
    ).first()
    
    if not discussion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Discussion non trouvée ou accès refusé"
        )
    
    # Mettre à jour les champs fournis
    if discussion_in.title is not None:
        discussion.title = discussion_in.title
    if discussion_in.is_group is not None:
        discussion.is_group = discussion_in.is_group
    
    discussion.updated_at = models.func.now()
    db.commit()
    db.refresh(discussion)
    
    return discussion

# Endpoints pour les messages
@router.post("/discussions/{discussion_id}/messages/", response_model=schemas.Message, status_code=status.HTTP_201_CREATED)
def create_message(
    discussion_id: int,
    message_in: MessageCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Envoyer un message dans une discussion
    """
    try:
        message = MessageService.create_message(
            db=db,
            message_in=message_in,
            discussion_id=discussion_id,
            sender_id=current_user.id
        )
        return message
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/discussions/{discussion_id}/messages/", response_model=PaginatedMessages)
def get_messages(
    discussion_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
):
    """
    Récupérer les messages d'une discussion avec pagination
    """
    try:
        return MessageService.get_messages(
            db=db,
            discussion_id=discussion_id,
            user_id=current_user.id,
            page=page,
            page_size=page_size
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/messages/{message_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_message_as_read(
    message_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Marquer un message comme lu
    """
    try:
        MessageService.mark_message_as_read(db, message_id, current_user.id)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.put("/messages/{message_id}", response_model=schemas.Message)
def update_message(
    message_id: int,
    message_in: MessageUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Mettre à jour un message
    """
    try:
        message = MessageService.update_message(
            db=db,
            message_id=message_id,
            message_update=message_in,
            user_id=current_user.id
        )
        return message
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(
    message_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Supprimer un message (soft delete)
    """
    try:
        deleted = MessageService.delete_message(
            db=db,
            message_id=message_id,
            user_id=current_user.id
        )
        if not deleted:
            return Response(status_code=status.HTTP_204_NO_CONTENT)  # Déjà supprimé
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
