"""add_test_messaging_data

Revision ID: 4e0b95574d83
Revises: 7e9916b9c0d7
Create Date: 2025-07-25 03:43:17.663360

"""
from datetime import datetime, timezone
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
from sqlalchemy import Integer, String, Text, DateTime, Boolean, ForeignKey

# revision identifiers, used by Alembic.
revision: str = '4e0b95574d83'
down_revision: Union[str, Sequence[str], None] = '7e9916b9c0d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    """Upgrade schema."""
    # Créer des tables SQLAlchemy pour l'insertion des données
    discussions = table(
        'discussions',
        column('id', Integer),
        column('title', String(200)),
        column('created_at', DateTime),
        column('updated_at', DateTime),
        column('created_by', Integer),
        column('is_group', Boolean)
    )
    
    discussion_participants = table(
        'discussion_participants',
        column('user_id', Integer),
        column('discussion_id', Integer),
        column('joined_at', DateTime),
        column('is_active', Boolean)
    )
    
    messages = table(
        'messages',
        column('id', Integer),
        column('content', Text),
        column('sent_at', DateTime),
        column('updated_at', DateTime),
        column('discussion_id', Integer),
        column('sender_id', Integer)
    )
    
    # Données de test
    now = datetime.now(timezone.utc)
    
    # 1. Créer une discussion de groupe
    op.bulk_insert(discussions, [
        {
            'id': 1,
            'title': 'Général',
            'created_at': now,
            'updated_at': now,
            'created_by': 1,  # ID d'un utilisateur existant
            'is_group': True
        },
        {
            'id': 2,
            'title': 'Discussion privée',
            'created_at': now,
            'updated_at': now,
            'created_by': 2,  # ID d'un autre utilisateur existant
            'is_group': False
        }
    ])
    
    # 2. Ajouter des participants aux discussions
    op.bulk_insert(discussion_participants, [
        # Discussion de groupe (id: 1)
        {'user_id': 1, 'discussion_id': 1, 'joined_at': now, 'is_active': True},
        {'user_id': 2, 'discussion_id': 1, 'joined_at': now, 'is_active': True},
        {'user_id': 3, 'discussion_id': 1, 'joined_at': now, 'is_active': True},
        
        # Discussion privée (id: 2)
        {'user_id': 1, 'discussion_id': 2, 'joined_at': now, 'is_active': True},
        {'user_id': 2, 'discussion_id': 2, 'joined_at': now, 'is_active': True}
    ])
    
    # 3. Ajouter des messages
    op.bulk_insert(messages, [
        # Messages dans le groupe
        {
            'content': 'Bienvenue dans le groupe général !',
            'sent_at': now,
            'updated_at': now,
            'discussion_id': 1,
            'sender_id': 1
        },
        {
            'content': 'Merci, content d\'être là !',
            'sent_at': now,
            'updated_at': now,
            'discussion_id': 1,
            'sender_id': 2
        },
        
        # Messages dans la discussion privée
        {
            'content': 'Salut, comment ça va ?',
            'sent_at': now,
            'updated_at': now,
            'discussion_id': 2,
            'sender_id': 1
        },
        {
            'content': 'Ça va bien merci, et toi ?',
            'sent_at': now,
            'updated_at': now,
            'discussion_id': 2,
            'sender_id': 2
        }
    ])


def downgrade() -> None:
    """Downgrade schema."""
    # Supprimer les données de test (dans l'ordre inverse de la création)
    op.execute("DELETE FROM messages WHERE discussion_id IN (1, 2)")
    op.execute("DELETE FROM discussion_participants WHERE discussion_id IN (1, 2)")
    op.execute("DELETE FROM discussions WHERE id IN (1, 2)")
