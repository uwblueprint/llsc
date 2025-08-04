"""merge heads

Revision ID: 88c4cf2a6bd2
Revises: abcd1234active, d6d4e2e5af85, fef3717e0fc2
Create Date: 2025-07-20 16:06:01.056373

"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "88c4cf2a6bd2"
down_revision: Union[str, None] = ("abcd1234active", "d6d4e2e5af85", "fef3717e0fc2")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
