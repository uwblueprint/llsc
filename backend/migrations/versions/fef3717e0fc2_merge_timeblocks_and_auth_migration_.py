"""merge timeblocks and auth migration heads

Revision ID: fef3717e0fc2
Revises: 062c84c8ff35, 8bfb115acac1
Create Date: 2025-06-15 12:24:49.480099

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fef3717e0fc2'
down_revision: Union[str, None] = ('062c84c8ff35', '8bfb115acac1')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
