"""seed intake forms

Revision ID: seed_intake_forms
Revises: f11846c50673
Create Date: 2025-06-29 15:30:00.000000

"""
import uuid
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'seed_intake_forms'
down_revision: Union[str, None] = 'f11846c50673'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Generate static UUIDs for forms to ensure consistency
PARTICIPANT_FORM_ID = uuid.uuid4()
VOLUNTEER_FORM_ID = uuid.uuid4()

def upgrade() -> None:
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
                "id": PARTICIPANT_FORM_ID,
                "name": "Participant Intake Form",
                "version": 1,
                "type": "intake"
            },
            {
                "id": VOLUNTEER_FORM_ID,
                "name": "Volunteer Intake Form",
                "version": 1,
                "type": "intake"
            }
        ],
    )

def downgrade() -> None:
    op.execute(f"DELETE FROM forms WHERE id IN ('{PARTICIPANT_FORM_ID}', '{VOLUNTEER_FORM_ID}')")
