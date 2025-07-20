"""seed experiences table

Revision ID: e6cf430117b4
Revises: 1e275ca8f74d
Create Date: 2025-06-29 15:29:47.004086

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e6cf430117b4"
down_revision: Union[str, None] = "1e275ca8f74d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.bulk_insert(
        sa.table(
            "experiences",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
        ),
        [
            {"id": 1, "name": "PTSD"},
            {"id": 2, "name": "Relapse"},
            {"id": 3, "name": "Anxiety"},
            {"id": 4, "name": "Depression"},
            {"id": 5, "name": "Fatigue"},
            {"id": 6, "name": "Neuropathy"},
            {"id": 7, "name": "Hair Loss"},
            {"id": 8, "name": "Nausea"},
            {"id": 9, "name": "Loss of Appetite"},
            {"id": 10, "name": "Sleep Problems"},
            {"id": 11, "name": "Cognitive Changes"},
            {"id": 12, "name": "Financial Stress"},
            {"id": 13, "name": "Relationship Changes"},
            {"id": 14, "name": "Body Image Issues"},
            {"id": 15, "name": "Survivorship Concerns"},
        ],
    )


def downgrade() -> None:
    op.execute("DELETE FROM experiences WHERE id IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15)")
