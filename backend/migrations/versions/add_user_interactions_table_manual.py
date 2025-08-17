"""add user_interactions table

Revision ID: 1234abcd5678
Revises: 
Create Date: 2025-07-03 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '1234abcd5678'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Création de la table user_interactions
    op.create_table(
        'user_interactions',
        sa.Column('id', sa.Integer(), nullable=False, primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('entity_type', sa.String(50), nullable=False, index=True),
        sa.Column('entity_id', sa.Integer(), nullable=False, index=True),
        sa.Column('interaction_type', sa.String(50), nullable=False, index=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        mysql_charset='utf8mb4',
        mysql_engine='InnoDB',
        mysql_collate='utf8mb4_unicode_ci'
    )
    
    # Création des index supplémentaires
    op.create_index('idx_user_entity', 'user_interactions', ['user_id', 'entity_type', 'entity_id'])
    op.create_index('idx_user_interaction_type', 'user_interactions', ['user_id', 'interaction_type'])
    op.create_index('idx_entity_interactions', 'user_interactions', ['entity_type', 'entity_id'])
    op.create_index('idx_interaction_created', 'user_interactions', ['created_at'])

def downgrade():
    # Suppression des index
    op.drop_index('idx_entity_interactions', table_name='user_interactions')
    op.drop_index('idx_user_interaction_type', table_name='user_interactions')
    op.drop_index('idx_user_entity', table_name='user_interactions')
    op.drop_index('idx_interaction_created', table_name='user_interactions')
    
    # Suppression de la table
    op.drop_table('user_interactions')
