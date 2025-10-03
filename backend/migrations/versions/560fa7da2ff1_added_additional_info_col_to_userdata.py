"""added additional info col to userdata

Revision ID: 560fa7da2ff1
Revises: add_scope_enum_to_experiences
Create Date: 2025-10-02 19:41:51.533804

"""
from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = '560fa7da2ff1'
down_revision: Union[str, None] = 'b56e0bf600a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
