"""merge heads

Revision ID: 7e9916b9c0d7
Revises: 330de1d3c151, 1234abcd5678
Create Date: 2025-07-25 03:36:03.044399

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7e9916b9c0d7'
down_revision: Union[str, Sequence[str], None] = ('330de1d3c151', '1234abcd5678')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
