"""added additional info col to userdata

Revision ID: 560fa7da2ff1
Revises: b56e0bf600a2
Create Date: 2025-10-02 19:41:51.533804

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '560fa7da2ff1'
down_revision: Union[str, None] = 'b56e0bf600a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add additional_info column to user_data table
    op.add_column(
        'user_data',
        sa.Column('additional_info', sa.Text(), nullable=True),
    )


def downgrade() -> None:
    # Remove additional_info column from user_data table
    op.drop_column('user_data', 'additional_info')
