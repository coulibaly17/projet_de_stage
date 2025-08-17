from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy.sql import func, and_
from app.database import get_db
from app.models.user import User
from app.models.messaging import Discussion, Message, MessageRead, MessageAttachment
from app.models.discussion_participants import discussion_participants
from app.services.auth_service import get_current_active_user
from pydantic import BaseModel, Field
from datetime import datetime, timedelta, timezone
import os
import uuid
from pathlib import Path

# Constantes pour les messages
DISCUSSION_NOT_FOUND = "Discussion non trouvée ou accès non autorisé"
NO_MESSAGE = "Aucun message"
UNKNOWN_USER = "Utilisateur inconnu"

# Constantes pour les noms d'utilisateurs de démonstration
DEMO_USER_JEAN = "Jean Dupont"
DEMO_USER_SOPHIE = "Dr. Sophie Martin"
DEMO_USER_MARIE = "Marie Martin"
DEMO_USER_LUCAS = "Lucas Bernard"

router = APIRouter()

# Schémas Pydantic pour les discussions
class MessageAttachmentResponse(BaseModel):
    id: int
    originalFilename: str
    fileSize: int
    mimeType: str
    downloadUrl: str

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    pass

class MessageResponse(MessageBase):
    id: int
    authorId: int
    authorName: str
    createdAt: datetime
    updatedAt: Optional[datetime] = None
    attachments: List[MessageAttachmentResponse] = []

class DiscussionBase(BaseModel):
    title: str
    courseId: Optional[int] = None
    tags: List[str] = []

class DiscussionCreate(DiscussionBase):
    initialMessage: str
    participantIds: List[int] = Field(default_factory=list, description="Liste des IDs des participants à la discussion")

class DiscussionUpdate(BaseModel):
    title: Optional[str] = None
    tags: Optional[List[str]] = None
    isArchived: Optional[bool] = None

class DiscussionResponse(DiscussionBase):
    id: int
    createdAt: datetime
    updatedAt: datetime
    createdBy: int
    creatorName: str
    messageCount: int
    lastMessageAt: datetime
    lastMessageBy: str
    participants: List[Dict[str, Any]] = []
    isArchived: bool = False
    messages: Optional[List[MessageResponse]] = None

# Schémas de réponse pour les discussions et les messages

# Endpoints pour les discussions

@router.get("/", response_model=List[Dict[str, Any]])
async def get_all_discussions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    course_id: Optional[int] = None,
    tag: Optional[str] = None,
    unread_only: Optional[bool] = False
):
    """
    Récupère toutes les discussions accessibles à l'utilisateur.
    Peut être filtré par cours, tag et discussions non lues.
    """
    print("\n=== Début get_all_discussions ===")
    print(f"Utilisateur: {current_user.username} (ID: {current_user.id})")
    print(f"Paramètres: course_id={course_id}, tag={tag}, unread_only={unread_only}")
    
    # Récupérer toutes les discussions auxquelles l'utilisateur participe
    discussions_query = db.query(Discussion).join(
        discussion_participants,
        Discussion.id == discussion_participants.c.discussion_id
    ).filter(
        discussion_participants.c.user_id == current_user.id
    )
    
    # Appliquer les filtres
    if course_id is not None:
        # Si vous avez une relation avec les cours, ajoutez le filtre ici
        pass
        
    if tag:
        # Si vous avez des tags dans votre modèle, ajoutez le filtre ici
        pass
    
    # Exécuter la requête
    discussions = discussions_query.all()
    
    # Construire la réponse
    result = []
    for discussion in discussions:
        # Récupérer le dernier message
        last_message = db.query(Message).filter(
            Message.discussion_id == discussion.id
        ).order_by(Message.sent_at.desc()).first()
        
        # Récupérer les participants
        participants = db.query(
            User.id,
            User.first_name,
            User.last_name,
            User.role
        ).join(
            discussion_participants,
            User.id == discussion_participants.c.user_id
        ).filter(
            discussion_participants.c.discussion_id == discussion.id
        ).all()
        
        # Compter les messages
        message_count = db.query(Message).filter(
            Message.discussion_id == discussion.id
        ).count()
        
        # Construire l'objet de discussion
        discussion_data = {
            "id": discussion.id,
            "title": discussion.title,
            "createdAt": discussion.created_at,
            "updatedAt": discussion.updated_at,
            "createdBy": discussion.created_by,
            "creatorName": f"{next((p.first_name + ' ' + p.last_name for p in participants if p.id == discussion.created_by), UNKNOWN_USER)}",
            "messageCount": message_count,
            "lastMessageAt": last_message.sent_at if last_message else discussion.updated_at,
            "lastMessageBy": f"{last_message.sender.first_name} {last_message.sender.last_name}" if last_message and last_message.sender else "Aucun message",
            "participants": [{
                "id": p.id,
                "name": f"{p.first_name} {p.last_name}",
                "role": p.role
            } for p in participants],
            "isArchived": False,  # À implémenter si nécessaire
            "isGroup": discussion.is_group
        }
        
        # Ajouter des champs facultatifs si nécessaires
        if hasattr(discussion, 'course_id') and discussion.course_id:
            discussion_data["courseId"] = discussion.course_id
            
        result.append(discussion_data)
    
    # Trier par date de dernier message (du plus récent au plus ancien)
    result.sort(key=lambda x: x["lastMessageAt"], reverse=True)
    
    # Appliquer le filtre des discussions non lues si demandé
    if unread_only:
        # Pour l'instant, on ne peut pas déterminer facilement les discussions non lues
        # car nous n'avons pas d'information sur les messages lus
        # Vous devrez implémenter cette logique en fonction de votre modèle de données
        pass
    
    print(f"\n=== Fin get_all_discussions: {len(result)} discussions ===\n")
    return result

@router.post("/", response_model=DiscussionResponse, status_code=status.HTTP_201_CREATED)
async def create_discussion(
    discussion: DiscussionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Crée une nouvelle discussion avec un message initial.
    Pour les discussions individuelles (1 participant), vérifie d'abord si une discussion existe déjà.
    """
    # Vérifier si les participants existent
    if not discussion.participantIds:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Au moins un participant est requis pour créer une discussion"
        )
    
    # Vérifier que les participants existent
    existing_participants = db.query(User).filter(
        User.id.in_(discussion.participantIds)
    ).all()
    
    if len(existing_participants) != len(discussion.participantIds):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Un ou plusieurs participants n'ont pas été trouvés"
        )
    
    # Pour les discussions individuelles, vérifier si une discussion existe déjà
    is_group = len(discussion.participantIds) > 1
    
    if not is_group:
        # Discussion individuelle - vérifier si une discussion existe déjà avec ce participant
        participant_id = discussion.participantIds[0]
        existing_discussion = db.query(Discussion).join(
            discussion_participants,
            and_(
                Discussion.id == discussion_participants.c.discussion_id,
                discussion_participants.c.user_id.in_([current_user.id, participant_id])
            )
        ).group_by(Discussion.id).having(
            func.count(discussion_participants.c.user_id) == 2
        ).first()
        
        if existing_discussion:
            # Mettre à jour la date de mise à jour et renvoyer la discussion existante
            existing_discussion.updated_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(existing_discussion)
            
            # Récupérer le dernier message pour la réponse
            last_message = db.query(Message).filter(
                Message.discussion_id == existing_discussion.id
            ).order_by(Message.sent_at.desc()).first()
            
            return {
                "id": existing_discussion.id,
                "title": existing_discussion.title,
                "createdAt": existing_discussion.created_at,
                "updatedAt": existing_discussion.updated_at,
                "createdBy": existing_discussion.created_by,
                "creatorName": f"{current_user.first_name} {current_user.last_name}",
                "messageCount": db.query(Message).filter(Message.discussion_id == existing_discussion.id).count(),
                "lastMessageAt": last_message.sent_at if last_message else existing_discussion.updated_at,
                "lastMessageBy": f"{current_user.first_name} {current_user.last_name}" if last_message else "",
                "isGroup": False,
                "participants": [{
                    "id": p.id,
                    "name": f"{p.first_name} {p.last_name}",
                    "email": p.email
                } for p in [current_user, existing_participants[0]] if p]
            }
    
    # Créer une nouvelle discussion
    discussion_title = discussion.title
    if not discussion_title:
        if is_group:
            discussion_title = f"Groupe avec {len(discussion.participantIds)} personnes"
        else:
            # Pour les discussions individuelles, utiliser le nom du participant
            participant = existing_participants[0]
            discussion_title = f"{participant.first_name} {participant.last_name}"
    
    db_discussion = Discussion(
        title=discussion_title,
        created_by=current_user.id,
        updated_at=datetime.now(timezone.utc),
        is_group=is_group
    )
    
    db.add(db_discussion)
    db.flush()  # Pour obtenir l'ID de la discussion
    
    # Ajouter l'utilisateur actuel comme participant s'il n'est pas déjà dans la liste
    if current_user.id not in discussion.participantIds:
        discussion.participantIds.append(current_user.id)
    
    # Ajouter tous les participants à la discussion
    for participant_id in discussion.participantIds:
        db.execute(
            discussion_participants.insert().values(
                discussion_id=db_discussion.id,
                user_id=participant_id,
                joined_at=datetime.now(timezone.utc)
            )
        )
    
    # Créer le message initial
    db_message = Message(
        discussion_id=db_discussion.id,
        sender_id=current_user.id,
        content=discussion.initialMessage,
        sent_at=datetime.now(timezone.utc)
    )
    
    db.add(db_message)
    db.commit()
    db.refresh(db_discussion)
    
    # Construire la réponse
    response = {
        "id": db_discussion.id,
        "title": db_discussion.title,
        "createdAt": db_discussion.created_at,
        "updatedAt": db_discussion.updated_at,
        "createdBy": db_discussion.created_by,
        "creatorName": f"{current_user.first_name} {current_user.last_name}",
        "messageCount": 1,
        "lastMessageAt": db_message.sent_at,
        "lastMessageBy": f"{current_user.first_name} {current_user.last_name}",
        "participants": [{
            "id": current_user.id,
            "name": f"{current_user.first_name} {current_user.last_name}",
            "role": current_user.role
        }],
        "isArchived": False,
        "messages": [{
            "id": db_message.id,
            "content": db_message.content,
            "createdAt": db_message.sent_at,
            "updatedAt": None,
            "authorId": db_message.sender_id,
            "authorName": f"{current_user.first_name} {current_user.last_name}",
            "attachments": []
        }]
    }
    
    # Ajouter le courseId s'il est défini
    if db_discussion.course_id:
        response["courseId"] = db_discussion.course_id
    
    return response

@router.get("/{discussion_id}", response_model=DiscussionResponse)
async def get_discussion(
    discussion_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Récupère une discussion spécifique avec ses messages.
    """
    # Vérifier que l'utilisateur a accès à cette discussion
    discussion = db.query(Discussion).join(
        discussion_participants,
        Discussion.id == discussion_participants.c.discussion_id
    ).filter(
        Discussion.id == discussion_id,
        discussion_participants.c.user_id == current_user.id
    ).first()
    
    if not discussion:
        raise HTTPException(status_code=404, detail=DISCUSSION_NOT_FOUND)
    
    # Récupérer les participants
    participants = db.query(
        User.id,
        User.first_name,
        User.last_name,
        User.role
    ).join(
        discussion_participants,
        User.id == discussion_participants.c.user_id
    ).filter(
        discussion_participants.c.discussion_id == discussion.id
    ).all()
    
    # Récupérer les messages de la discussion
    messages = db.query(Message).filter(
        Message.discussion_id == discussion.id
    ).order_by(Message.sent_at.asc()).all()
    
    # Marquer les messages comme lus par l'utilisateur actuel
    for message in messages:
        if message.sender_id != current_user.id:  # Ne pas marquer ses propres messages comme lus
            message_read = db.query(MessageRead).filter(
                MessageRead.message_id == message.id,
                MessageRead.user_id == current_user.id
            ).first()
            
            if not message_read:
                message_read = MessageRead(
                    message_id=message.id,
                    user_id=current_user.id,
                    read_at=datetime.now(timezone.utc)
                )
                db.add(message_read)
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Erreur lors de la mise à jour des messages lus: {e}")
    
    # Construire la réponse
    response = {
        "id": discussion.id,
        "title": discussion.title,
        "createdAt": discussion.created_at,
        "updatedAt": discussion.updated_at,
        "createdBy": discussion.created_by,
        "creatorName": f"{next((p.first_name + ' ' + p.last_name for p in participants if p.id == discussion.created_by), UNKNOWN_USER)}",
        "messageCount": len(messages),
        "lastMessageAt": messages[-1].sent_at if messages else discussion.updated_at,
        "lastMessageBy": f"{messages[-1].sender.first_name} {messages[-1].sender.last_name}" if messages else NO_MESSAGE,
        "participants": [{
            "id": p.id,
            "name": f"{p.first_name} {p.last_name}",
            "role": p.role
        } for p in participants],
        "isArchived": False,  # À implémenter si nécessaire
        "isGroup": discussion.is_group,
        "messages": [{
            "id": msg.id,
            "content": msg.content,
            "createdAt": msg.sent_at,
            "updatedAt": msg.updated_at,
            "authorId": msg.sender_id,
            "authorName": f"{msg.sender.first_name} {msg.sender.last_name}",
            "isRead": any(r.user_id == current_user.id for r in msg.read_by) if msg.sender_id != current_user.id else True,
            "attachments": []  # À implémenter si nécessaire
        } for msg in messages]
    }
    
    # Ajouter le courseId s'il est défini
    if discussion.course_id:
        response["courseId"] = discussion.course_id
    
    return response

@router.put("/{discussion_id}", response_model=DiscussionResponse)
async def update_discussion(
    discussion_id: int,
    discussion_update: DiscussionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Met à jour une discussion existante.
    """
    # Récupérer la discussion
    discussion = db.query(Discussion).filter(Discussion.id == discussion_id).first()
    
    if not discussion:
        raise HTTPException(status_code=404, detail=DISCUSSION_NOT_FOUND)
    
    # Vérifier que l'utilisateur est le créateur de la discussion ou un enseignant
    if discussion.created_by != current_user.id and current_user.role != "enseignant":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'êtes pas autorisé à modifier cette discussion"
        )
    
    # Mettre à jour les champs spécifiés
    if discussion_update.title is not None:
        discussion.title = discussion_update.title
    
    if discussion_update.tags is not None:
        # Si vous avez un champ tags dans votre modèle, mettez-le à jour ici
        pass
        
    if discussion_update.isArchived is not None:
        # Si vous avez un champ is_archived dans votre modèle, mettez-le à jour ici
        pass
    
    # Mettre à jour la date de mise à jour
    discussion.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(discussion)
    
    # Récupérer les participants pour la réponse
    participants = db.query(
        User.id,
        User.first_name,
        User.last_name,
        User.role
    ).join(
        discussion_participants,
        User.id == discussion_participants.c.user_id
    ).filter(
        discussion_participants.c.discussion_id == discussion.id
    ).all()
    
    # Récupérer le dernier message pour lastMessageBy
    last_message = db.query(Message).filter(
        Message.discussion_id == discussion.id
    ).order_by(Message.sent_at.desc()).first()
    
    # Compter les messages
    message_count = db.query(Message).filter(
        Message.discussion_id == discussion.id
    ).count()
    
    # Construire la réponse
    response = {
        "id": discussion.id,
        "title": discussion.title,
        "createdAt": discussion.created_at,
        "updatedAt": discussion.updated_at,
        "createdBy": discussion.created_by,
        "creatorName": f"{next((p.first_name + ' ' + p.last_name for p in participants if p.id == discussion.created_by), UNKNOWN_USER)}",
        "messageCount": message_count,
        "lastMessageAt": last_message.sent_at if last_message else discussion.updated_at,
        "lastMessageBy": f"{last_message.sender.first_name} {last_message.sender.last_name}" if last_message else NO_MESSAGE,
        "participants": [{
            "id": p.id,
            "name": f"{p.first_name} {p.last_name}",
            "role": p.role
        } for p in participants],
        "isArchived": False,  # À implémenter si nécessaire
        "isGroup": discussion.is_group
    }
    
    # Ajouter le courseId s'il est défini
    if hasattr(discussion, 'course_id') and discussion.course_id:
        response["courseId"] = discussion.course_id
    
    return response

@router.post("/{discussion_id}/messages", response_model=MessageResponse)
async def add_message(
    request: Request,
    discussion_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Ajoute un message à une discussion existante avec support des pièces jointes.
    """
    # Déterminer le type de contenu et extraire les données
    content_type = request.headers.get("content-type", "")
    
    print(f"\n=== Début add_message ===")
    print(f"Content-Type: {content_type}")
    
    if "multipart/form-data" in content_type:
        # Traiter FormData (avec ou sans fichiers)
        form = await request.form()
        content = form.get("content", "")
        attachments = form.getlist("attachments")
        # Filtrer les fichiers vides
        attachments = [f for f in attachments if hasattr(f, 'filename') and f.filename]
    else:
        # Traiter JSON (messages texte seuls)
        json_data = await request.json()
        content = json_data.get("content", "")
        attachments = []
    
    # Vérifier que la discussion existe et que l'utilisateur y a accès
    discussion = db.query(Discussion).join(
        discussion_participants,
        Discussion.id == discussion_participants.c.discussion_id
    ).filter(
        Discussion.id == discussion_id,
        discussion_participants.c.user_id == current_user.id
    ).first()
    
    if not discussion:
        raise HTTPException(status_code=404, detail=DISCUSSION_NOT_FOUND)
    
    # Traiter les pièces jointes si présentes
    print(f"\n=== Début traitement des pièces jointes ===")
    print(f"Attachments reçus: {attachments}")
    print(f"Type: {type(attachments)}")
    print(f"Nombre d'attachments: {len(attachments) if attachments else 0}")
    
    attachment_data = []
    if attachments and len(attachments) > 0:
        # Créer le dossier d'upload s'il n'existe pas
        upload_dir = Path("uploads/messages")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        for file in attachments:
            if file.filename:
                # Générer un nom unique pour le fichier
                file_extension = Path(file.filename).suffix
                unique_filename = f"{uuid.uuid4()}{file_extension}"
                file_path = upload_dir / unique_filename
                
                # Sauvegarder le fichier
                with open(file_path, "wb") as buffer:
                    content_file = await file.read()
                    buffer.write(content_file)
                
                attachment_data.append({
                    "original_filename": file.filename,
                    "stored_filename": unique_filename,
                    "file_path": str(file_path),
                    "file_size": len(content_file),
                    "mime_type": file.content_type
                })
    
    # Créer le contenu du message
    message_content = content
    # Les pièces jointes sont maintenant affichées séparément dans l'interface
    # Pas besoin d'ajouter de texte au contenu du message
    
    # Créer le nouveau message
    db_message = Message(
        discussion_id=discussion_id,
        sender_id=current_user.id,
        content=message_content,
        sent_at=datetime.now(timezone.utc)
    )
    
    db.add(db_message)
    
    # Mettre à jour la date de mise à jour de la discussion
    discussion.updated_at = datetime.now(timezone.utc)
    
    # Vérifier si l'utilisateur est déjà un participant
    existing_participant = db.query(discussion_participants).filter(
        discussion_participants.c.discussion_id == discussion_id,
        discussion_participants.c.user_id == current_user.id
    ).first()
    
    # Ajouter l'utilisateur comme participant s'il ne l'est pas déjà
    if not existing_participant:
        db.execute(
            discussion_participants.insert().values(
                discussion_id=discussion_id,
                user_id=current_user.id,
                joined_at=datetime.now(timezone.utc)
            )
        )
    
    # Valider les changements dans la base de données pour obtenir l'ID du message
    db.commit()
    db.refresh(db_message)
    
    # Sauvegarder les métadonnées des pièces jointes
    if attachment_data:
        print(f"\n=== Sauvegarde de {len(attachment_data)} pièces jointes ===")
        for attachment in attachment_data:
            print(f"Sauvegarde: {attachment['original_filename']} -> {attachment['stored_filename']}")
            db_attachment = MessageAttachment(
                message_id=db_message.id,
                original_filename=attachment["original_filename"],
                stored_filename=attachment["stored_filename"],
                file_path=attachment["file_path"],
                file_size=attachment["file_size"],
                mime_type=attachment["mime_type"]
            )
            db.add(db_attachment)
    
    # Maintenant que nous avons un ID de message valide, marquer le message comme lu par l'expéditeur
    db_message_read = MessageRead(
        message_id=db_message.id,
        user_id=current_user.id,
        read_at=datetime.now(timezone.utc)
    )
    db.add(db_message_read)
    
    # Valider TOUS les changements (attachments + message read)
    db.commit()
    db.refresh(db_message)
    
    # Vérifier que les attachments ont bien été sauvegardés
    if attachment_data:
        saved_attachments = db.query(MessageAttachment).filter(
            MessageAttachment.message_id == db_message.id
        ).all()
        print(f"Vérification: {len(saved_attachments)} attachments sauvegardés en base")
        for att in saved_attachments:
            print(f"  -> ID: {att.id}, Fichier: {att.original_filename}")
    
    # Récupérer les informations de l'expéditeur
    sender = db.query(User).filter(User.id == current_user.id).first()
    
    # Récupérer les pièces jointes du message créé
    message_attachments = db.query(MessageAttachment).filter(
        MessageAttachment.message_id == db_message.id
    ).all()
    
    attachments_data = []
    for attachment in message_attachments:
        attachments_data.append({
            "id": attachment.id,
            "originalFilename": attachment.original_filename,
            "fileSize": attachment.file_size,
            "mimeType": attachment.mime_type,
            "downloadUrl": f"/api/v1/discussions/attachments/{attachment.id}/download"
        })
    
    # Construire la réponse
    response = {
        "id": db_message.id,
        "discussionId": db_message.discussion_id,
        "authorId": db_message.sender_id,
        "authorName": f"{sender.first_name} {sender.last_name}",
        "content": db_message.content,
        "createdAt": db_message.sent_at,
        "updatedAt": db_message.updated_at,
        "isRead": True,  # Le message est marqué comme lu pour l'expéditeur
        "attachments": attachments_data
    }
    
    return response

@router.get("/{discussion_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    discussion_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = 0,
    limit: int = 50
):
    """
    Récupère les messages d'une discussion avec pagination.
    """
    # Vérifier que la discussion existe et que l'utilisateur y a accès
    discussion = db.query(Discussion).join(
        discussion_participants,
        Discussion.id == discussion_participants.c.discussion_id
    ).filter(
        Discussion.id == discussion_id,
        discussion_participants.c.user_id == current_user.id
    ).first()
    
    if not discussion:
        raise HTTPException(status_code=404, detail=DISCUSSION_NOT_FOUND)
    
    # Récupérer les messages de la discussion avec pagination
    messages = db.query(Message).filter(
        Message.discussion_id == discussion_id
    ).order_by(
        Message.sent_at.desc()
    ).offset(skip).limit(limit).all()
    
    print(f"\n=== Récupération des messages pour la discussion {discussion_id} ===")
    print(f"Nombre de messages trouvés: {len(messages)}")
    
    # Marquer les messages non lus comme lus pour l'utilisateur courant
    unread_messages = []
    for msg in messages:
        # Vérifier si le message a déjà été lu par l'utilisateur
        is_read = db.query(MessageRead).filter(
            MessageRead.message_id == msg.id,
            MessageRead.user_id == current_user.id
        ).first()
        
        # Si le message n'a pas encore été lu et n'est pas de l'utilisateur courant
        if not is_read and msg.sender_id != current_user.id:
            unread_messages.append(msg.id)
            
        # Afficher les détails du message pour le débogage
        print(f"Message ID: {msg.id}, Contenu: {msg.content[:50]}..., Expéditeur: {msg.sender_id}, Date: {msg.sent_at}")
    
    # Marquer les messages non lus comme lus
    if unread_messages:
        try:
            for msg_id in unread_messages:
                db_message_read = MessageRead(
                    message_id=msg_id,
                    user_id=current_user.id,
                    read_at=datetime.now(timezone.utc)
                )
                db.add(db_message_read)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Erreur lors du marquage des messages comme lus: {e}")
    
    # Construire la réponse
    response = []
    for msg in messages:
        # Vérifier si le message a été lu par l'utilisateur
        is_read = msg.sender_id == current_user.id or db.query(MessageRead).filter(
            MessageRead.message_id == msg.id,
            MessageRead.user_id == current_user.id
        ).first() is not None
        
        # Récupérer les informations de l'expéditeur
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        
        # Récupérer les pièces jointes du message
        attachments = db.query(MessageAttachment).filter(
            MessageAttachment.message_id == msg.id
        ).all()
        
        attachments_data = []
        for attachment in attachments:
            attachments_data.append({
                "id": attachment.id,
                "originalFilename": attachment.original_filename,
                "fileSize": attachment.file_size,
                "mimeType": attachment.mime_type,
                "downloadUrl": f"/api/v1/discussions/attachments/{attachment.id}/download"
            })
        
        response.append({
            "id": msg.id,
            "discussionId": msg.discussion_id,
            "authorId": msg.sender_id,
            "authorName": f"{sender.first_name} {sender.last_name}" if sender else UNKNOWN_USER,
            "content": msg.content,
            "createdAt": msg.sent_at,
            "updatedAt": msg.updated_at,
            "isRead": is_read,
            "attachments": attachments_data
        })
    
    # Inverser l'ordre pour avoir les plus anciens en premier
    response.reverse()
    
    # Afficher la réponse avant de la renvoyer
    print("\n=== Réponse JSON qui sera renvoyée ===")
    for msg in response:
        attachments_info = f" - {len(msg.get('attachments', []))} attachments" if msg.get('attachments') else " - Pas d'attachments"
        print(f"Message ID: {msg['id']}, Auteur: {msg['authorName']}, Contenu: {msg['content'][:50]}...{attachments_info}")
        if msg.get('attachments'):
            for att in msg['attachments']:
                print(f"  -> Attachment: {att.get('originalFilename', 'N/A')} ({att.get('fileSize', 0)} bytes)")
    print("=== Fin de la réponse ===\n")
    
    return response


@router.get("/attachments/{attachment_id}/download")
async def download_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Télécharge une pièce jointe par son ID.
    """
    # Récupérer la pièce jointe
    attachment = db.query(MessageAttachment).filter(
        MessageAttachment.id == attachment_id
    ).first()
    
    if not attachment:
        raise HTTPException(status_code=404, detail="Pièce jointe non trouvée")
    
    # Vérifier que l'utilisateur a accès à cette pièce jointe
    # (via l'accès à la discussion du message)
    message = db.query(Message).filter(Message.id == attachment.message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message non trouvé")
    
    # Vérifier l'accès à la discussion
    discussion = db.query(Discussion).join(
        discussion_participants,
        Discussion.id == discussion_participants.c.discussion_id
    ).filter(
        Discussion.id == message.discussion_id,
        discussion_participants.c.user_id == current_user.id
    ).first()
    
    if not discussion:
        raise HTTPException(status_code=403, detail="Accès refusé à cette pièce jointe")
    
    # Vérifier que le fichier existe
    if not os.path.exists(attachment.file_path):
        raise HTTPException(status_code=404, detail="Fichier non trouvé sur le serveur")
    
    # Retourner le fichier
    return FileResponse(
        path=attachment.file_path,
        filename=attachment.original_filename,
        media_type=attachment.mime_type or 'application/octet-stream'
    )
