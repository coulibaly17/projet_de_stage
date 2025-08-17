from sqlalchemy import Table, Column, Integer, ForeignKey, DateTime, Boolean
from sqlalchemy.sql import func
from app.database import Base

# Table de jointure pour les participants aux discussions
discussion_participants = Table(
    'discussion_participants',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('discussion_id', Integer, ForeignKey('discussions.id'), primary_key=True),
    Column('joined_at', DateTime, server_default=func.now(), nullable=False),
    Column('is_active', Boolean, server_default='1', nullable=False)
)
