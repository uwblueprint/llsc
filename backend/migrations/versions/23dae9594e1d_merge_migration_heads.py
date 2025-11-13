"""merge migration heads

Revision ID: 23dae9594e1d
Revises: 14fdeccc883f, 2ccee7a88d08, 560fa7da2ff1
Create Date: 2025-11-13 13:22:16.658661

"""
from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = '23dae9594e1d'
down_revision: Union[str, None] = ('14fdeccc883f', '2ccee7a88d08', '560fa7da2ff1')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
