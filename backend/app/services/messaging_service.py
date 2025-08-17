from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_

from app.models.messaging import Discussion, Message, MessageRead, discussion_participants
from app.models.user import User
from app.schemas.messaging import (
    MessageCreate, DiscussionCreate, DiscussionUpdate, 
    PaginatedMessages, DiscussionWithMessages, DiscussionInList
)
from app.core.config import settings

class MessageService:
    @staticmethod
    def create_message(
        db: Session, 
        message_in: MessageCreate, 
        discussion_id: int, 
        sender_id: int
    ) -> Message:
        """
        Crée un nouveau message dans une discussion
        """
        # Vérifier que l'expéditeur fait partie de la discussion
        discussion = db.query(Discussion).filter(
            Discussion.id == discussion_id,
            Discussion.participants.any(id=sender_id)
        ).first()
        
        if not discussion:
            raise ValueError("Discussion non trouvée ou accès non autorisé")
        
        # Créer le message
        db_message = Message(
            content=message_in.content,
            discussion_id=discussion_id,
            sender_id=sender_id,
            sent_at=datetime.now(timezone.utc)
        )
        
        db.add(db_message)
        db.commit()
        db.refresh(db_message)
        
        # Mettre à jour la date de mise à jour de la discussion
        discussion.updated_at = datetime.now(timezone.utc)
        db.commit()
        
        return db_message

    @staticmethod
    def get_messages(
        db: Session, 
        discussion_id: int, 
        user_id: int,
        page: int = 1, 
        page_size: int = 50
    ) -> PaginatedMessages:
        """
        Récupère les messages d'une discussion avec pagination
        """
        # Vérifier que la discussion existe et que l'utilisateur est un participant
        discussion = db.query(Discussion).filter(
            Discussion.id == discussion_id,
            Discussion.participants.any(id=user_id)  # Vérifie directement la participation
        ).first()
        
        if not discussion:
            raise ValueError("Discussion non trouvée ou accès refusé")
        
        # Récupérer les messages avec pagination et jointure sur l'expéditeur
        query = db.query(Message).options(
            joinedload(Message.sender)  # Charge automatiquement l'expéditeur
        ).filter(
            Message.discussion_id == discussion_id
        )
        
        total = query.count()
        
        messages = query.order_by(Message.sent_at.desc())\
                      .offset((page - 1) * page_size)\
                      .limit(page_size)\
                      .all()
        
        # Convertir les messages en format de réponse
        message_responses = []
        for message in messages:
            # Marquer le message comme lu s'il ne vient pas de l'utilisateur
            if message.sender_id != user_id:
                MessageService.mark_message_as_read(db, message.id, user_id)
            
            # Créer la réponse formatée
            message_responses.append({
                'id': message.id,
                'content': message.content,
                'discussion_id': message.discussion_id,
                'user_id': str(message.sender_id),
                'user_name': f"{message.sender.first_name} {message.sender.last_name}",
                'user_avatar': message.sender.avatar,
                'created_at': message.sent_at.isoformat(),
                'is_read': any(read.user_id == user_id for read in message.read_by)
            })
        
        return PaginatedMessages(
            items=message_responses,
            total=total,
            page=page,
            size=page_size,
            total_pages=(total + page_size - 1) // page_size
        )

    @staticmethod
    def mark_message_as_read(db: Session, message_id: int, user_id: int) -> None:
        """
        Marque un message comme lu par un utilisateur
        """
        # Vérifier si le message a déjà été marqué comme lu
        read = db.query(MessageRead).filter(
            MessageRead.message_id == message_id,
            MessageRead.user_id == user_id
        ).first()
        
        if not read:
            read = MessageRead(
                message_id=message_id,
                user_id=user_id,
                read_at=datetime.now(timezone.utc)
            )
            db.add(read)
            db.commit()
            
    @staticmethod
    def update_message(
        db: Session,
        message_id: int,
        message_update: MessageUpdate,
        user_id: int
    ) -> Message:
        """
        Met à jour le contenu d'un message
        """
        # Récupérer le message
        message = db.query(Message).filter(Message.id == message_id).first()
        if not message:
            raise ValueError("Message non trouvé")
            
        # Vérifier que l'utilisateur est l'expéditeur du message
        if message.sender_id != user_id:
            raise ValueError("Vous n'êtes pas autorisé à modifier ce message")
            
        # Vérifier que le message n'est pas supprimé
        if message.is_deleted:
            raise ValueError("Impossible de modifier un message supprimé")
            
        # Mettre à jour le contenu du message
        if message_update.content is not None:
            message.content = message_update.content
            message.updated_at = datetime.now(timezone.utc)
            
            db.commit()
            db.refresh(message)
            
            # Mettre à jour la date de mise à jour de la discussion
            discussion = db.query(Discussion).filter(
                Discussion.id == message.discussion_id
            ).first()
            if discussion:
                discussion.updated_at = datetime.now(timezone.utc)
                db.commit()
        
        return message
        
    @staticmethod
    def delete_message(
        db: Session,
        message_id: int,
        user_id: int
    ) -> bool:
        """
        Supprime un message (soft delete)
        Retourne True si le message a été supprimé, False s'il était déjà supprimé
        """
        # Récupérer le message
        message = db.query(Message).filter(Message.id == message_id).first()
        if not message:
            raise ValueError("Message non trouvé")
            
        # Vérifier que l'utilisateur est l'expéditeur du message ou un administrateur
        if message.sender_id != user_id:
            # Ici, vous pouvez ajouter une vérification de rôle administrateur
            raise ValueError("Vous n'êtes pas autorisé à supprimer ce message")
            
        # Vérifier si le message n'est pas déjà supprimé
        if not message.is_deleted:
            message.is_deleted = True
            message.updated_at = datetime.now(timezone.utc)
            db.commit()
            
            # Mettre à jour la date de mise à jour de la discussion
            discussion = db.query(Discussion).filter(
                Discussion.id == message.discussion_id
            ).first()
            if discussion:
                discussion.updated_at = datetime.now(timezone.utc)
                db.commit()
                
            return True
            
        return False

class DiscussionService:
    @staticmethod
    def create_discussion(
        db: Session, 
        discussion_in: DiscussionCreate, 
        creator_id: int
    ) -> Tuple[Discussion, Message]:
        """
        Crée une nouvelle discussion avec un message initial
        """
        # Vérifier que le créateur existe
        creator = db.query(User).filter(User.id == creator_id).first()
        if not creator:
            raise ValueError("Créateur non trouvé")
        
        # Préparer la liste des participants uniques (en incluant le créateur)
        participant_list = list(set([creator_id] + [p for p in discussion_in.participant_ids if p != creator_id]))
        
        # Vérifier que tous les participants existent
        existing_users = db.query(User.id).filter(
            User.id.in_(participant_list)
        ).all()
        existing_user_ids = {user.id for user in existing_users}
        
        # Vérifier si tous les participants existent
        missing_participants = set(participant_list) - existing_user_ids
        if missing_participants:
            raise ValueError(f"Les utilisateurs suivants n'existent pas: {missing_participants}")
        
        # Créer la discussion
        discussion = Discussion(
            title=discussion_in.title,
            created_by=creator_id,
            is_group=discussion_in.is_group or len(participant_list) > 2,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        db.add(discussion)
        db.flush()  # Pour obtenir l'ID de la discussion
        
        # Ajouter les participants à la discussion
        for user_id in participant_list:
            discussion.participants.append(db.query(User).filter(User.id == user_id).first())
        
        # Créer le message initial
        message_service = MessageService()
        initial_message = message_service.create_message(
            db=db,
            message_in=MessageCreate(content=discussion_in.initial_message),
            discussion_id=discussion.id,
            sender_id=creator_id
        )
        
        db.commit()
        db.refresh(discussion)
        
        return discussion, initial_message
    
    @staticmethod
    def get_user_discussions(
        db: Session, 
        user_id: int,
        page: int = 1, 
        page_size: int = 20
    ) -> PaginatedMessages:
        """
        Récupère les discussions d'un utilisateur avec pagination
        """
        # Récupérer les discussions de l'utilisateur
        query = db.query(Discussion).join(
            models.discussion_participants, 
            and_(
                models.discussion_participants.c.discussion_id == Discussion.id,
                models.discussion_participants.c.user_id == user_id
            )
        )
        
        total = query.count()
        
        discussions = query.order_by(Discussion.updated_at.desc())\
                          .offset((page - 1) * page_size)\
                          .limit(page_size)\
                          .all()
        
        # Pour chaque discussion, récupérer le dernier message et le nombre de messages non lus
        result = []
        for discussion in discussions:
            # Récupérer le dernier message
            last_message = db.query(Message)\
                           .filter(Message.discussion_id == discussion.id)\
                           .order_by(Message.sent_at.desc())\
                           .first()
            
            # Compter les messages non lus
            unread_count = db.query(Message)\
                           .outerjoin(
                               MessageRead,
                               and_(
                                   MessageRead.message_id == Message.id,
                                   MessageRead.user_id == user_id
                               )
                           )\
                           .filter(
                               Message.discussion_id == discussion.id,
                               Message.sender_id != user_id,
                               MessageRead.id.is_(None)
                           )\
                           .count()
            
            # Récupérer les participants
            discussion_participants = db.query(User).join(
                models.discussion_participants,
                models.discussion_participants.c.user_id == User.id
            ).filter(
                models.discussion_participants.c.discussion_id == discussion.id
            ).all()
            
            discussion_dict = {
                **discussion.__dict__,
                'last_message': last_message,
                'unread_count': unread_count,
                'participants': discussion_participants
            }
            
            result.append(discussion_dict)
        
        return PaginatedMessages(
            items=result,
            total=total,
            page=page,
            size=page_size,
            total_pages=(total + page_size - 1) // page_size
        )
    
    @staticmethod
    def get_discussion(
        db: Session, 
        discussion_id: int, 
        user_id: int
    ) -> Optional[DiscussionWithMessages]:
        """
        Récupère une discussion avec ses messages
        """
        # Vérifier que l'utilisateur fait partie de la discussion
        discussion = db.query(Discussion).filter(
            Discussion.id == discussion_id,
            Discussion.participants.any(id=user_id)
        ).first()
        
        if not discussion:
            return None
        
        # Récupérer les messages
        messages = db.query(Message)\
                   .filter(Message.discussion_id == discussion_id)\
                   .order_by(Message.sent_at.asc())\
                   .all()
        
        # Marquer les messages comme lus
        for message in messages:
            if message.sender_id != user_id:  # Ne pas marquer ses propres messages comme lus
                MessageService.mark_message_as_read(db, message.id, user_id)
        
        # Ajouter les participants
        participants = db.query(User).join(
            participants,
            participants.c.user_id == User.id
        ).filter(
            participants.c.discussion_id == discussion.id
        ).all()
        
        return {
            **discussion.__dict__,
            'messages': messages,
            'participants': participants
        }
