"""merge heads before ranking work

Revision ID: fb0638c24174
Revises: 7b797eccb3aa, 88c4cf2a6bd2
Create Date: 2025-08-31 20:48:25.460360

"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "fb0638c24174"
down_revision: Union[str, None] = ("7b797eccb3aa", "88c4cf2a6bd2")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
