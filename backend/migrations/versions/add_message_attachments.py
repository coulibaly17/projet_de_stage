"""Add message attachments table

Revision ID: add_message_attachments
Revises: 1e9215e2684d
Create Date: 2025-07-30 11:06:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_message_attachments'
down_revision = '1e9215e2684d'
branch_labels = None
depends_on = None

def upgrade():
    # Créer la table message_attachments
    op.create_table(
        'message_attachments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('message_id', sa.Integer(), nullable=False),
        sa.Column('original_filename', sa.String(255), nullable=False),
        sa.Column('stored_filename', sa.String(255), nullable=False),
        sa.Column('file_path', sa.String(500), nullable=False),
        sa.Column('file_size', sa.BigInteger(), nullable=False),
        sa.Column('mime_type', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['message_id'], ['messages.id'], ondelete='CASCADE'),
        mysql_engine='InnoDB',
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_general_ci'
    )
    
    # Créer les index
    op.create_index('idx_message_attachments_message_id', 'message_attachments', ['message_id'])

def downgrade():
    # Supprimer la table
    op.drop_table('message_attachments')
