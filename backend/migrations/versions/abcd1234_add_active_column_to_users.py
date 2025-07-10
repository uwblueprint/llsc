"""add active column to users

Revision ID: abcd1234active
Revises: df571b763807
Create Date: 2025-07-08
"""

import sqlalchemy as sa
from alembic import op

revision = "abcd1234active"
down_revision = "df571b763807"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()))


def downgrade():
    op.drop_column("users", "active")
