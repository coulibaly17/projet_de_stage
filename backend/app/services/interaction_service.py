from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
import json

from ..models import UserInteraction
from ..schemas.interaction import EntityType, InteractionType, UserInteractionStats

class InteractionService:
    def __init__(self, db: Session):
        self.db = db
    
    def log_interaction(
        self,
        user_id: int,
        entity_type: str,
        entity_id: int,
        interaction_type: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> UserInteraction:
        """
        Enregistre une interaction utilisateur dans la base de données
        """
        interaction = UserInteraction(
            user_id=user_id,
            entity_type=entity_type,
            entity_id=entity_id,
            interaction_type=interaction_type,
            interaction_metadata=metadata or {}
        )
        
        self.db.add(interaction)
        self.db.commit()
        self.db.refresh(interaction)
        
        return interaction
    
    def get_user_interactions(
        self,
        user_id: int,
        entity_type: Optional[EntityType] = None,
        interaction_type: Optional[InteractionType] = None,
        entity_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Tuple[List[UserInteraction], int]:
        """
        Récupère les interactions d'un utilisateur avec des filtres optionnels
        Retourne un tuple (liste des interactions, nombre total)
        """
        query = self.db.query(UserInteraction).filter(
            UserInteraction.user_id == user_id
        )
        
        # Filtres optionnels
        if entity_type:
            query = query.filter(UserInteraction.entity_type == entity_type.value)
            
        if interaction_type:
            query = query.filter(UserInteraction.interaction_type == interaction_type.value)
            
        if entity_id is not None:
            query = query.filter(UserInteraction.entity_id == entity_id)
            
        if start_date:
            query = query.filter(UserInteraction.created_at >= start_date)
            
        if end_date:
            query = query.filter(UserInteraction.created_at <= end_date)
        
        # Compte total pour la pagination
        total = query.count()
        
        # Application du tri et de la pagination
        interactions = query.order_by(
            UserInteraction.created_at.desc()
        ).offset(offset).limit(limit).all()
        
        return interactions, total
        
    def get_user_stats(
        self,
        user_id: int,
        days: int = 30
    ) -> UserInteractionStats:
        """
        Récupère des statistiques sur les interactions d'un utilisateur
        """
        # Date de début pour les statistiques
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Requête de base
        query = self.db.query(
            UserInteraction.interaction_type,
            UserInteraction.entity_type,
            func.count().label('count')
        ).filter(
            UserInteraction.user_id == user_id,
            UserInteraction.created_at >= start_date
        ).group_by(
            UserInteraction.interaction_type,
            UserInteraction.entity_type
        )
        
        # Dernière interaction
        last_interaction = self.db.query(UserInteraction).filter(
            UserInteraction.user_id == user_id
        ).order_by(
            UserInteraction.created_at.desc()
        ).first()
        
        # Agrégation des résultats
        interaction_types = {}
        entity_types = {}
        total = 0
        
        for row in query.all():
            total += row.count
            
            # Comptage par type d'interaction
            if row.interaction_type not in interaction_types:
                interaction_types[row.interaction_type] = 0
            interaction_types[row.interaction_type] += row.count
            
            # Comptage par type d'entité
            if row.entity_type not in entity_types:
                entity_types[row.entity_type] = 0
            entity_types[row.entity_type] += row.count
        
        return UserInteractionStats(
            total_interactions=total,
            last_interaction=last_interaction.created_at if last_interaction else None,
            interaction_types=interaction_types,
            entity_types=entity_types
        )
        
    def has_interacted_with(
        self,
        user_id: int,
        entity_type: EntityType,
        entity_id: int,
        interaction_type: Optional[InteractionType] = None
    ) -> bool:
        """
        Vérifie si un utilisateur a interagi avec une entité
        """
        query = self.db.query(UserInteraction).filter(
            UserInteraction.user_id == user_id,
            UserInteraction.entity_type == entity_type.value,
            UserInteraction.entity_id == entity_id
        )
        
        if interaction_type:
            query = query.filter(UserInteraction.interaction_type == interaction_type.value)
            
        return query.count() > 0
