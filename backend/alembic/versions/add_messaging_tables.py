"""Add messaging tables

Revision ID: 1234abcd5678
Revises: 
Create Date: 2025-07-25 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# Constantes pour les noms de tables et colonnes
USERS_TABLE = 'users'
DISCUSSIONS_TABLE = 'discussions'
MESSAGES_TABLE = 'messages'
MESSAGE_READS_TABLE = 'message_reads'
DISCUSSION_PARTICIPANTS_TABLE = 'discussion_participants'

# Noms de colonnes
USER_ID = 'user_id'
DISCUSSION_ID = 'discussion_id'
MESSAGE_ID = 'message_id'

# revision identifiers, used by Alembic.
revision = '1234abcd5678'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Table de discussion
    op.create_table(DISCUSSIONS_TABLE,
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), onupdate=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('is_group', sa.Boolean(), server_default=sa.text('0'), nullable=False),
        sa.ForeignKeyConstraint(['created_by'], [f"{USERS_TABLE}.id"], name='fk_discussion_creator', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Table de participants aux discussions (relation many-to-many)
    op.create_table(DISCUSSION_PARTICIPANTS_TABLE,
        sa.Column(USER_ID, sa.Integer(), nullable=False),
        sa.Column(DISCUSSION_ID, sa.Integer(), nullable=False),
        sa.Column('joined_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('1'), nullable=False),
        sa.ForeignKeyConstraint([USER_ID], [f"{USERS_TABLE}.id"], name='fk_discussion_participant_user', ondelete='CASCADE'),
        sa.ForeignKeyConstraint([DISCUSSION_ID], [f"{DISCUSSIONS_TABLE}.id"], name='fk_discussion_participant_discussion', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint(USER_ID, DISCUSSION_ID)
    )
    
    # Table des messages
    op.create_table(MESSAGES_TABLE,
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('sent_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), onupdate=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column(DISCUSSION_ID, sa.Integer(), nullable=False),
        sa.Column('sender_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint([DISCUSSION_ID], [f"{DISCUSSIONS_TABLE}.id"], name='fk_message_discussion', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['sender_id'], [f"{USERS_TABLE}.id"], name='fk_message_sender', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Table pour le suivi des messages lus
    op.create_table(MESSAGE_READS_TABLE,
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column(MESSAGE_ID, sa.Integer(), nullable=False),
        sa.Column(USER_ID, sa.Integer(), nullable=False),
        sa.Column('read_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.ForeignKeyConstraint([MESSAGE_ID], [f"{MESSAGES_TABLE}.id"], name='fk_message_read_message', ondelete='CASCADE'),
        sa.ForeignKeyConstraint([USER_ID], [f"{USERS_TABLE}.id"], name='fk_message_read_user', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(MESSAGE_ID, USER_ID, name='uq_message_read')
    )
    
    # Création des index pour les requêtes fréquentes
    op.create_index(f'ix_{DISCUSSIONS_TABLE}_created_by', DISCUSSIONS_TABLE, ['created_by'], unique=False)
    op.create_index(f'ix_{MESSAGES_TABLE}_{DISCUSSION_ID}', MESSAGES_TABLE, [DISCUSSION_ID], unique=False)
    op.create_index(f'ix_{MESSAGES_TABLE}_sender_id', MESSAGES_TABLE, ['sender_id'], unique=False)
    op.create_index(f'ix_{MESSAGE_READS_TABLE}_{MESSAGE_ID}', MESSAGE_READS_TABLE, [MESSAGE_ID], unique=False)
    op.create_index(f'ix_{MESSAGE_READS_TABLE}_{USER_ID}', MESSAGE_READS_TABLE, [USER_ID], unique=False)
    op.create_index(f'ix_{DISCUSSION_PARTICIPANTS_TABLE}_{DISCUSSION_ID}', DISCUSSION_PARTICIPANTS_TABLE, [DISCUSSION_ID], unique=False)
    op.create_index(f'ix_{DISCUSSION_PARTICIPANTS_TABLE}_{USER_ID}', DISCUSSION_PARTICIPANTS_TABLE, [USER_ID], unique=False)


def downgrade():
    # Supprimer les index
    op.drop_index(f'ix_{DISCUSSION_PARTICIPANTS_TABLE}_{USER_ID}', table_name=DISCUSSION_PARTICIPANTS_TABLE)
    op.drop_index(f'ix_{DISCUSSION_PARTICIPANTS_TABLE}_{DISCUSSION_ID}', table_name=DISCUSSION_PARTICIPANTS_TABLE)
    op.drop_index(f'ix_{MESSAGE_READS_TABLE}_{USER_ID}', table_name=MESSAGE_READS_TABLE)
    op.drop_index(f'ix_{MESSAGE_READS_TABLE}_{MESSAGE_ID}', table_name=MESSAGE_READS_TABLE)
    op.drop_index(f'ix_{MESSAGES_TABLE}_sender_id', table_name=MESSAGES_TABLE)
    op.drop_index(f'ix_{MESSAGES_TABLE}_{DISCUSSION_ID}', table_name=MESSAGES_TABLE)
    op.drop_index(f'ix_{DISCUSSIONS_TABLE}_created_by', table_name=DISCUSSIONS_TABLE)
    
    # Supprimer les tables dans le bon ordre pour éviter les problèmes de clés étrangères
    op.drop_table(MESSAGE_READS_TABLE)
    op.drop_table(MESSAGES_TABLE)
    op.drop_table(DISCUSSION_PARTICIPANTS_TABLE)
    op.drop_table(DISCUSSIONS_TABLE)
