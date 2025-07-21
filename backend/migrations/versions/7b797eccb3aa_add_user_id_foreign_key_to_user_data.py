"""add_user_id_foreign_key_to_user_data

Revision ID: 7b797eccb3aa
Revises: 2a086aa5a4ad
Create Date: 2025-07-20 15:20:07.646983

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "7b797eccb3aa"
down_revision: Union[str, None] = "2a086aa5a4ad"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Step 1: Add user_id column as nullable initially
    op.add_column("user_data", sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True))

    # Step 2: Delete existing relationships and user_data records (assuming test data)
    op.execute("DELETE FROM user_experiences")
    op.execute("DELETE FROM user_treatments")
    op.execute("DELETE FROM user_loved_one_experiences")
    op.execute("DELETE FROM user_loved_one_treatments")
    op.execute("DELETE FROM user_data")

    # Step 3: Make the column NOT NULL now that table is empty
    op.alter_column("user_data", "user_id", nullable=False)

    # Step 4: Add foreign key constraint
    op.create_foreign_key("fk_user_data_user_id", "user_data", "users", ["user_id"], ["id"])


def downgrade() -> None:
    # Remove foreign key constraint and user_id column
    op.drop_constraint("fk_user_data_user_id", "user_data", type_="foreignkey")
    op.drop_column("user_data", "user_id")
