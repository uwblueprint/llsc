"""insert roles

Revision ID: 59bb2488a76b
Revises: 4ba3479cb8df
Create Date: 2024-10-16 16:55:42.324525

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "59bb2488a76b"
down_revision: Union[str, None] = "4ba3479cb8df"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.bulk_insert(
        sa.table(
            "roles",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(length=80), nullable=False),
        ),
        [
            {"id": 1, "name": "participant"},
            {"id": 2, "name": "volunteer"},
            {"id": 3, "name": "admin"},
        ],
    )


def downgrade() -> None:
    op.execute("DELETE FROM roles WHERE id IN (1, 2, 3)")
