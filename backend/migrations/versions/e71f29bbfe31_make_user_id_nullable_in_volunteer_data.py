"""make_user_id_nullable_in_volunteer_data

Revision ID: e71f29bbfe31
Revises: 6cfd431cb2e9
Create Date: 2025-06-22 01:09:44.851319

"""
from typing import Sequence, Union
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'e71f29bbfe31'
down_revision: Union[str, None] = '6cfd431cb2e9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make user_id nullable to allow public submissions without user accounts
    op.alter_column('volunteer_data', 'user_id', nullable=True)
    
    # Drop the unique constraint since we'll have multiple NULL values
    op.drop_constraint('uq_volunteer_data_user_id', 'volunteer_data', type_='unique')


def downgrade() -> None:
    # Recreate the unique constraint
    op.create_unique_constraint('uq_volunteer_data_user_id', 'volunteer_data', ['user_id'])
    
    # Make user_id non-nullable again
    op.alter_column('volunteer_data', 'user_id', nullable=False)
