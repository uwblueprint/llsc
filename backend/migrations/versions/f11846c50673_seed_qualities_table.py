"""seed qualities table

Revision ID: f11846c50673
Revises: e6cf430117b4
Create Date: 2025-06-29 15:29:51.672149

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f11846c50673"
down_revision: Union[str, None] = "e6cf430117b4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.bulk_insert(
        sa.table(
            "qualities",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("slug", sa.String(), nullable=False),
            sa.Column("label", sa.String(), nullable=False),
        ),
        [
            {"id": 1, "slug": "same_age", "label": "Similar Age"},
            {"id": 2, "slug": "same_diagnosis", "label": "Same Diagnosis"},
            {"id": 3, "slug": "same_stage", "label": "Same Cancer Stage"},
            {"id": 4, "slug": "same_treatment", "label": "Similar Treatment"},
            {"id": 5, "slug": "same_location", "label": "Geographic Proximity"},
            {"id": 6, "slug": "same_gender", "label": "Same Gender"},
            {"id": 7, "slug": "family_status", "label": "Similar Family Status"},
            {"id": 8, "slug": "career_stage", "label": "Similar Career Stage"},
            {"id": 9, "slug": "shared_interests", "label": "Shared Interests/Hobbies"},
            {"id": 10, "slug": "communication_style", "label": "Communication Style"},
            {"id": 11, "slug": "emotional_support", "label": "Emotional Support Preference"},
            {"id": 12, "slug": "practical_support", "label": "Practical Support Preference"},
        ],
    )


def downgrade() -> None:
    op.execute("DELETE FROM qualities WHERE id IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12)")
