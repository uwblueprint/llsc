"""add language enum and column to users model

Revision ID: 329a7ab72d38
Revises: 8d2cd99b9eb8
Create Date: 2025-11-06 19:37:26.647630

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "329a7ab72d38"
down_revision: Union[str, None] = "8d2cd99b9eb8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_LANGUAGE_VALUES = (
    "en",
    "fr",
)

_DEFAULT_LANGUAGE = "en"


def upgrade() -> None:
    op.execute("CREATE TYPE language_enum AS ENUM ('en', 'fr')")

    op.add_column(
        "users",
        sa.Column(
            "language",
            sa.Enum(*_LANGUAGE_VALUES, name="language_enum", create_type=False),
            nullable=False,
            server_default=_DEFAULT_LANGUAGE,
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "language")
    op.execute("DROP TYPE language_enum")
