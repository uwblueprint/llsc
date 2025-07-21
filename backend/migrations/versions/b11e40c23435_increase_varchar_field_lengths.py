"""increase_varchar_field_lengths

Revision ID: b11e40c23435
Revises: 747735a17ed8
Create Date: 2025-07-13 16:42:47.456742

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b11e40c23435"
down_revision: Union[str, None] = "747735a17ed8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Increase VARCHAR(10) fields to VARCHAR(256) to accommodate longer values
    op.alter_column("user_data", "has_kids", existing_type=sa.VARCHAR(10), type_=sa.VARCHAR(256), nullable=True)

    op.alter_column("user_data", "has_blood_cancer", existing_type=sa.VARCHAR(10), type_=sa.VARCHAR(256), nullable=True)

    op.alter_column(
        "user_data", "caring_for_someone", existing_type=sa.VARCHAR(10), type_=sa.VARCHAR(256), nullable=True
    )

    op.alter_column("user_data", "loved_one_age", existing_type=sa.VARCHAR(10), type_=sa.VARCHAR(256), nullable=True)


def downgrade() -> None:
    # Revert back to VARCHAR(10)
    op.alter_column("user_data", "loved_one_age", existing_type=sa.VARCHAR(256), type_=sa.VARCHAR(10), nullable=True)

    op.alter_column(
        "user_data", "caring_for_someone", existing_type=sa.VARCHAR(256), type_=sa.VARCHAR(10), nullable=True
    )

    op.alter_column("user_data", "has_blood_cancer", existing_type=sa.VARCHAR(256), type_=sa.VARCHAR(10), nullable=True)

    op.alter_column("user_data", "has_kids", existing_type=sa.VARCHAR(256), type_=sa.VARCHAR(10), nullable=True)
