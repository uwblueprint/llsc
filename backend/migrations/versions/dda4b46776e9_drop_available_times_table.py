"""drop_available_times_table

Revision ID: dda4b46776e9
Revises: 2141551638c9
Create Date: 2025-11-20 14:40:37.626596

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'dda4b46776e9'
down_revision: Union[str, None] = '2141551638c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop the available_times association table (replaced by availability_templates)
    op.drop_table('available_times')


def downgrade() -> None:
    # Recreate available_times table (for rollback purposes)
    op.create_table(
        'available_times',
        sa.Column('time_block_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['time_block_id'], ['time_blocks.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('time_block_id', 'user_id')
    )
