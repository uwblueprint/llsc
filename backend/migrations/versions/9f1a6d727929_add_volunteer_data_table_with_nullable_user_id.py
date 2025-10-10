"""add_volunteer_data_table_with_nullable_user_id

Revision ID: 9f1a6d727929
Revises: ba215810568b
Create Date: 2025-10-09 20:00:20.836685

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "9f1a6d727929"
down_revision: Union[str, None] = "ba215810568b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "volunteer_data",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=True),
        sa.Column("experience", sa.Text(), nullable=True),
        sa.Column("references_json", sa.Text(), nullable=True),
        sa.Column("additional_comments", sa.Text(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("volunteer_data")
