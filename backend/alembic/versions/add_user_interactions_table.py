"""add user_interactions table

Revision ID: 1234abcd5678
Revises: previous_revision_id
Create Date: 2025-07-03 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '1234abcd5678'
down_revision = 'previous_revision_id'
branch_labels = None
depends_on = None

def upgrade():
    # Création de la table user_interactions
    op.create_table('user_interactions',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('entity_type', sa.String(50), nullable=False, index=True),
        sa.Column('entity_id', sa.Integer(), nullable=False, index=True),
        sa.Column('interaction_type', sa.String(50), nullable=False, index=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Index('idx_user_entity', 'user_id', 'entity_type', 'entity_id'),
        sa.Index('idx_user_interaction_type', 'user_id', 'interaction_type'),
    )
    
    # Ajout d'index pour améliorer les performances des requêtes courantes
    op.create_index('idx_interaction_created', 'user_interactions', ['created_at'])
    op.create_index('idx_entity_interactions', 'user_interactions', ['entity_type', 'entity_id'])

def downgrade():
    # Suppression des index
    op.drop_index('idx_entity_interactions', table_name='user_interactions')
    op.drop_index('idx_interaction_created', table_name='user_interactions')
    
    # Suppression de la table
    op.drop_table('user_interactions')
