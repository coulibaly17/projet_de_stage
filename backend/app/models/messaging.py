from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, BigInteger
from sqlalchemy.orm import relationship
from app.database import Base
from .discussion_participants import discussion_participants

# Constantes pour les noms de tables
USERS_TABLE = 'users'
DISCUSSIONS_TABLE = 'discussions'

class Discussion(Base):
    """
    Modèle pour les discussions de groupe ou les conversations privées
    """
    __tablename__ = DISCUSSIONS_TABLE
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, ForeignKey(f'{USERS_TABLE}.id'), nullable=False)
    is_group = Column(Boolean, default=False)  # True pour les groupes, False pour les conversations privées
    
    # Relations
    participants = relationship(
        'User',
        secondary=discussion_participants,
        back_populates='discussions',
        lazy='dynamic'
    )
    messages = relationship('Message', back_populates='discussion', cascade='all, delete-orphan')


class Message(Base):
    """
    Modèle pour les messages dans une discussion
    """
    __tablename__ = 'messages'
    
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    sent_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    discussion_id = Column(Integer, ForeignKey(f'{DISCUSSIONS_TABLE}.id'), nullable=False)
    sender_id = Column(Integer, ForeignKey(f'{USERS_TABLE}.id'), nullable=False)
    
    # Champs supplémentaires
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    # Relations
    discussion = relationship('Discussion', back_populates='messages')
    sender = relationship('User', back_populates='sent_messages')
    read_by = relationship('MessageRead', back_populates='message', cascade='all, delete-orphan')
    attachments = relationship('MessageAttachment', back_populates='message', cascade='all, delete-orphan')


class MessageAttachment(Base):
    """
    Modèle pour les pièces jointes des messages
    """
    __tablename__ = 'message_attachments'
    
    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey('messages.id'), nullable=False)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    mime_type = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relations
    message = relationship('Message', back_populates='attachments')


class MessageRead(Base):
    """
    Modèle pour suivre les messages lus par les utilisateurs
    """
    __tablename__ = 'message_reads'
    
    id = Column(Integer, primary_key=True)
    message_id = Column(Integer, ForeignKey('messages.id'), nullable=False)
    user_id = Column(Integer, ForeignKey(f'{USERS_TABLE}.id'), nullable=False)
    read_at = Column(DateTime, default=datetime.utcnow)
    
    # Relations
    message = relationship('Message', back_populates='read_by')
    user = relationship('User', back_populates='read_messages')
    
    # Contrainte d'unicité
    __table_args__ = (
        {'sqlite_autoincrement': True},
    )
