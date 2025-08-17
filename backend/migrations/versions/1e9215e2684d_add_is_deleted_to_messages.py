"""add_is_deleted_to_messages

Revision ID: 1e9215e2684d
Revises: 4e0b95574d83
Create Date: 2025-07-25 03:52:19.742121

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1e9215e2684d'
down_revision: Union[str, None] = '4e0b95574d83'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Ajouter la colonne is_deleted à la table messages
    op.add_column('messages', 
        sa.Column('is_deleted', sa.Boolean(), 
                 server_default=sa.text('0'), 
                 nullable=False))


def downgrade() -> None:
    # Supprimer la colonne is_deleted
    op.drop_column('messages', 'is_deleted')
