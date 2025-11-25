"""merge multiple heads

Revision ID: 93cc5dac324a
Revises: 23dae9594e1d, 329a7ab72d38
Create Date: 2025-11-24 19:04:33.167997

"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "93cc5dac324a"
down_revision: Union[str, None] = ("23dae9594e1d", "329a7ab72d38")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
