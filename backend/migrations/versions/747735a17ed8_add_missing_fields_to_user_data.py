"""add missing fields to user_data

Revision ID: 747735a17ed8
Revises: 78073cc5fe98
Create Date: 2025-07-13 16:24:01.195384

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "747735a17ed8"
down_revision: Union[str, None] = "78073cc5fe98"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add missing fields to user_data table
    op.add_column("user_data", sa.Column("first_name", sa.String(80), nullable=True))
    op.add_column("user_data", sa.Column("last_name", sa.String(80), nullable=True))
    op.add_column("user_data", sa.Column("city", sa.String(100), nullable=True))
    op.add_column("user_data", sa.Column("province", sa.String(50), nullable=True))
    op.add_column("user_data", sa.Column("postal_code", sa.String(10), nullable=True))

    # Demographics fields
    op.add_column("user_data", sa.Column("gender_identity", sa.String(50), nullable=True))
    op.add_column("user_data", sa.Column("pronouns", sa.JSON, nullable=True))  # Array of strings
    op.add_column("user_data", sa.Column("ethnic_group", sa.JSON, nullable=True))  # Array of strings
    op.add_column("user_data", sa.Column("marital_status", sa.String(50), nullable=True))
    op.add_column("user_data", sa.Column("has_kids", sa.String(10), nullable=True))

    # Cancer experience fields
    op.add_column("user_data", sa.Column("diagnosis", sa.String(100), nullable=True))
    op.add_column("user_data", sa.Column("date_of_diagnosis", sa.Date, nullable=True))

    # "Other" text fields for custom entries
    op.add_column("user_data", sa.Column("other_treatment", sa.Text, nullable=True))
    op.add_column("user_data", sa.Column("other_experience", sa.Text, nullable=True))
    op.add_column("user_data", sa.Column("other_ethnic_group", sa.Text, nullable=True))
    op.add_column("user_data", sa.Column("gender_identity_custom", sa.Text, nullable=True))

    # Flow control fields
    op.add_column("user_data", sa.Column("has_blood_cancer", sa.String(10), nullable=True))
    op.add_column("user_data", sa.Column("caring_for_someone", sa.String(10), nullable=True))


def downgrade() -> None:
    # Remove added columns
    op.drop_column("user_data", "caring_for_someone")
    op.drop_column("user_data", "has_blood_cancer")
    op.drop_column("user_data", "gender_identity_custom")
    op.drop_column("user_data", "other_ethnic_group")
    op.drop_column("user_data", "other_experience")
    op.drop_column("user_data", "other_treatment")
    op.drop_column("user_data", "date_of_diagnosis")
    op.drop_column("user_data", "diagnosis")
    op.drop_column("user_data", "has_kids")
    op.drop_column("user_data", "marital_status")
    op.drop_column("user_data", "ethnic_group")
    op.drop_column("user_data", "pronouns")
    op.drop_column("user_data", "gender_identity")
    op.drop_column("user_data", "postal_code")
    op.drop_column("user_data", "province")
    op.drop_column("user_data", "city")
    op.drop_column("user_data", "last_name")
    op.drop_column("user_data", "first_name")
