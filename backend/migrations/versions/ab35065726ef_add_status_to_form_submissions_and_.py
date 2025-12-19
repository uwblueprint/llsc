"""add_status_to_form_submissions_and_rename_forms

Revision ID: ab35065726ef
Revises: 77423a45f740
Create Date: 2025-12-14 14:53:59.432036

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "ab35065726ef"
down_revision: Union[str, None] = "77423a45f740"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create enum type for form submission status
    op.execute("""
        CREATE TYPE form_submission_status AS ENUM (
            'pending_approval',
            'approved',
            'rejected'
        )
    """)

    # 2. Add status column to form_submissions table
    # Default to 'approved' for existing records (they were already processed)
    op.add_column(
        "form_submissions",
        sa.Column(
            "status",
            sa.Enum("pending_approval", "approved", "rejected", name="form_submission_status"),
            nullable=False,
            server_default="approved",
        ),
    )

    # 3. Rename existing intake forms to "First Connection" naming
    op.execute("""
        UPDATE forms
        SET name = 'First Connection Participant Form'
        WHERE name = 'Participant Intake Form'
    """)
    op.execute("""
        UPDATE forms
        SET name = 'First Connection Volunteer Form'
        WHERE name = 'Volunteer Intake Form'
    """)

    # 4. Add new forms if they don't exist
    # Ranking Form
    op.execute("""
        INSERT INTO forms (id, name, version, type)
        VALUES ('12345678-1234-1234-1234-123456789014', 'Ranking Form', 1, 'ranking')
        ON CONFLICT (id) DO NOTHING
    """)
    # Secondary Application Form
    op.execute("""
        INSERT INTO forms (id, name, version, type)
        VALUES ('12345678-1234-1234-1234-123456789015', 'Secondary Application Form', 1, 'secondary')
        ON CONFLICT (id) DO NOTHING
    """)
    # Become a Participant Form
    op.execute("""
        INSERT INTO forms (id, name, version, type)
        VALUES ('12345678-1234-1234-1234-123456789016', 'Become a Participant Form', 1, 'become_participant')
        ON CONFLICT (id) DO NOTHING
    """)
    # Become a Volunteer Form
    op.execute("""
        INSERT INTO forms (id, name, version, type)
        VALUES ('12345678-1234-1234-1234-123456789017', 'Become a Volunteer Form', 1, 'become_volunteer')
        ON CONFLICT (id) DO NOTHING
    """)


def downgrade() -> None:
    # 1. Drop status column
    op.drop_column("form_submissions", "status")

    # 2. Drop enum type
    op.execute("DROP TYPE form_submission_status")

    # 3. Revert form name changes
    op.execute("""
        UPDATE forms
        SET name = 'Participant Intake Form'
        WHERE name = 'First Connection Participant Form'
    """)
    op.execute("""
        UPDATE forms
        SET name = 'Volunteer Intake Form'
        WHERE name = 'First Connection Volunteer Form'
    """)

    # 4. Remove new forms
    op.execute("""
        DELETE FROM forms WHERE id IN (
            '12345678-1234-1234-1234-123456789014',
            '12345678-1234-1234-1234-123456789015',
            '12345678-1234-1234-1234-123456789016',
            '12345678-1234-1234-1234-123456789017'
        )
    """)
