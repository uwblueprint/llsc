"""add form status to users

Revision ID: b56e0bf600a2
Revises: a59aeb0bd691
Create Date: 2025-02-15 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b56e0bf600a2"
down_revision: Union[str, None] = "a59aeb0bd691"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_FORM_STATUS_VALUES = (
    "intake-todo",
    "intake-submitted",
    "ranking-todo",
    "ranking-submitted",
    "secondary-application-todo",
    "secondary-application-submitted",
    "completed",
)

_DEFAULT_STATUS = "intake-todo"
_ADMIN_STATUS = "completed"


def upgrade() -> None:
    op.execute(
        "CREATE TYPE form_status_enum AS ENUM ('intake-todo', 'intake-submitted', 'ranking-todo', "
        "'ranking-submitted', 'secondary-application-todo', 'secondary-application-submitted', 'completed')"
    )

    op.add_column(
        "users",
        sa.Column(
            "form_status",
            sa.Enum(*_FORM_STATUS_VALUES, name="form_status_enum", create_type=False),
            nullable=False,
            server_default=_DEFAULT_STATUS,
        ),
    )

    op.execute(f"UPDATE users SET form_status = '{_ADMIN_STATUS}' WHERE role_id = 3")


def downgrade() -> None:
    op.drop_column("users", "form_status")
    op.execute("DROP TYPE form_status_enum")
