"""create_tasks_table

Revision ID: ded0314bce37
Revises: seed_intake_forms
Create Date: 2025-09-29 19:52:52.161683

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "ded0314bce37"
down_revision: Union[str, None] = "seed_intake_forms"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create task_type enum
    op.execute(
        "CREATE TYPE task_type AS ENUM ('intake_form_review', 'volunteer_app_review', 'profile_update', 'matching')"
    )

    # Create task_priority enum
    op.execute("CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'no_status')")

    # Create task_status enum
    op.execute("CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed')")

    # Create tasks table
    op.create_table(
        "tasks",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("participant_id", sa.UUID(), nullable=False),
        sa.Column(
            "type",
            postgresql.ENUM(
                "intake_form_review", "volunteer_app_review", "profile_update", "matching", name="task_type"
            ),
            nullable=False,
        ),
        sa.Column(
            "priority",
            postgresql.ENUM("low", "medium", "high", "no_status", name="task_priority"),
            nullable=False,
            server_default="no_status",
        ),
        sa.Column("assignee_id", sa.UUID(), nullable=True),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "status",
            postgresql.ENUM("pending", "in_progress", "completed", name="task_status"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("task_metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["assignee_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["participant_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create indexes for common queries
    op.create_index("ix_tasks_participant_id", "tasks", ["participant_id"])
    op.create_index("ix_tasks_assignee_id", "tasks", ["assignee_id"])
    op.create_index("ix_tasks_type", "tasks", ["type"])
    op.create_index("ix_tasks_status", "tasks", ["status"])
    op.create_index("ix_tasks_priority", "tasks", ["priority"])


def downgrade() -> None:
    # Drop indexes
    op.drop_index("ix_tasks_priority", table_name="tasks")
    op.drop_index("ix_tasks_status", table_name="tasks")
    op.drop_index("ix_tasks_type", table_name="tasks")
    op.drop_index("ix_tasks_assignee_id", table_name="tasks")
    op.drop_index("ix_tasks_participant_id", table_name="tasks")

    # Drop tasks table
    op.drop_table("tasks")

    # Drop enums
    op.execute("DROP TYPE task_status")
    op.execute("DROP TYPE task_priority")
    op.execute("DROP TYPE task_type")
