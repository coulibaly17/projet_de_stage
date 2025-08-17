from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Index, Text
from sqlalchemy.sql import func
from sqlalchemy.dialects.mysql import LONGTEXT
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.orm import relationship
from ..database import Base

class UserInteraction(Base):
    """
    Modèle pour le suivi des interactions utilisateur.
    
    Stocke les interactions des utilisateurs avec différentes entités du système
    (cours, leçons, quiz, etc.) pour permettre des analyses comportementales
    et des recommandations personnalisées.
    """
    __tablename__ = "user_interactions"
    __table_args__ = (
        # Index composite pour les requêtes fréquentes
        Index('idx_user_entity', 'user_id', 'entity_type', 'entity_id'),
        Index('idx_entity', 'entity_type', 'entity_id'),
        Index('idx_interaction_type', 'interaction_type'),
        Index('idx_created_at', 'created_at'),
        {
            'mysql_engine': 'InnoDB',
            'mysql_charset': 'utf8mb4',
            'mysql_collate': 'utf8mb4_unicode_ci'
        }
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Référence à l'utilisateur
    user_id = Column(
        Integer, 
        ForeignKey(
            "users.id", 
            ondelete="CASCADE",
            name="fk_interaction_user"
        ), 
        nullable=False,
        index=True,
        comment="ID de l'utilisateur qui a effectué l'interaction"
    )
    
    # Type d'entité avec laquelle l'utilisateur a interagi
    entity_type = Column(
        String(50), 
        nullable=False,
        comment="Type d'entité (course, lesson, quiz, etc.)"
    )
    
    # ID de l'entité avec laquelle l'utilisateur a interagi
    entity_id = Column(
        Integer, 
        nullable=False,
        comment="ID de l'entité avec laquelle l'utilisateur a interagi"
    )
    
    # Type d'interaction (vue, clic, complétion, etc.)
    interaction_type = Column(
        String(50), 
        nullable=False,
        index=True,
        comment="Type d'interaction (view, click, complete, rate, etc.)"
    )
    
    # Métadonnées supplémentaires sur l'interaction
    interaction_metadata = Column(
        "metadata", 
        JSON,
        nullable=True,
        comment="Métadonnées supplémentaires sur l'interaction (contexte, durée, etc.)"
    )
    
    # Horodatage de création
    created_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(),
        nullable=False,
        index=True,
        comment="Date et heure de l'interaction"
    )
    
    # Champ pour les données brutes (si nécessaire pour le débogage)
    raw_data = Column(
        Text().with_variant(LONGTEXT, 'mysql'),
        nullable=True,
        comment="Données brutes de l'interaction (pour débogage)"
    )
    
    def __repr__(self):
        return (
            f"<UserInteraction(id={self.id}, "
            f"user_id={self.user_id}, "
            f"entity={self.entity_type}:{self.entity_id}, "
            f"type={self.interaction_type}, "
            f"at={self.created_at})>"
        )
    
    def to_dict(self):
        """Convertit l'objet en dictionnaire pour la sérialisation JSON"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'interaction_type': self.interaction_type,
            'metadata': self.interaction_metadata,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @classmethod
    def from_dict(cls, data):
        """Crée une instance à partir d'un dictionnaire"""
        return cls(
            user_id=data.get('user_id'),
            entity_type=data.get('entity_type'),
            entity_id=data.get('entity_id'),
            interaction_type=data.get('interaction_type'),
            interaction_metadata=data.get('metadata'),
            created_at=data.get('created_at')
        )
    
    @declared_attr
    def user(self):
        """Relation avec l'utilisateur"""
        return relationship("User", back_populates="interactions")
    
    @property
    def is_view(self):
        """Vérifie si c'est une interaction de type 'view'"""
        return self.interaction_type == 'view'
    
    def get_metadata_value(self, key, default=None):
        """Récupère une valeur des métadonnées"""
        if not self.interaction_metadata:
            return default
        return self.interaction_metadata.get(key, default)
