"""add task description column

Revision ID: e3f0a5b4b7c4
Revises: 9f1a6d727929
Create Date: 2025-02-14 05:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e3f0a5b4b7c4"
down_revision: Union[str, None] = "9f1a6d727929"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("tasks", sa.Column("description", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("tasks", "description")
