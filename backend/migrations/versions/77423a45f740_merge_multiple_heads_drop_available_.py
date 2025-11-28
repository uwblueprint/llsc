"""merge multiple heads drop_available_times_table

Revision ID: 77423a45f740
Revises: 93cc5dac324a, dda4b46776e9
Create Date: 2025-11-24 21:20:43.406772

"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "77423a45f740"
down_revision: Union[str, None] = ("93cc5dac324a", "dda4b46776e9")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
