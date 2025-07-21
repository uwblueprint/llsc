"""seed treatments table

Revision ID: 1e275ca8f74d
Revises: f4225af5f02c
Create Date: 2025-06-29 15:29:42.176058

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "1e275ca8f74d"
down_revision: Union[str, None] = "f4225af5f02c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.bulk_insert(
        sa.table(
            "treatments",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
        ),
        [
            {"id": 1, "name": "Chemotherapy"},
            {"id": 2, "name": "Immunotherapy"},
            {"id": 3, "name": "Radiation Therapy"},
            {"id": 4, "name": "Surgery"},
            {"id": 5, "name": "Targeted Therapy"},
            {"id": 6, "name": "Hormone Therapy"},
            {"id": 7, "name": "Stem Cell Transplant"},
            {"id": 8, "name": "CAR-T Cell Therapy"},
            {"id": 9, "name": "Clinical Trial"},
            {"id": 10, "name": "Palliative Care"},
        ],
    )


def downgrade() -> None:
    op.execute("DELETE FROM treatments WHERE id IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10)")
