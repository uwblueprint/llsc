"""seed_forms_table

Revision ID: 2a086aa5a4ad
Revises: b11e40c23435
Create Date: 2025-07-20 14:48:35.540230

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '2a086aa5a4ad'
down_revision: Union[str, None] = 'b11e40c23435'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Insert initial form records for participant and volunteer intake
    op.bulk_insert(
        sa.table(
            "forms",
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("version", sa.Integer(), nullable=False),
            sa.Column("type", sa.String(), nullable=False),
        ),
        [
            {
                "id": "12345678-1234-1234-1234-123456789012",
                "name": "Participant Intake Form", 
                "version": 1,
                "type": "intake"
            },
            {
                "id": "12345678-1234-1234-1234-123456789013",
                "name": "Volunteer Intake Form",
                "version": 1, 
                "type": "intake"
            }
        ]
    )


def downgrade() -> None:
    # Remove the seeded forms
    op.execute("DELETE FROM forms WHERE id IN ('12345678-1234-1234-1234-123456789012', '12345678-1234-1234-1234-123456789013')")
