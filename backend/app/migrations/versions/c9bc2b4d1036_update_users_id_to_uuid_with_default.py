"""Update users id to UUID with default

Revision ID: c9bc2b4d1036
Revises: 79de0b981dd8
Create Date: 2024-10-16 17:13:53.820521

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c9bc2b4d1036"
down_revision: Union[str, None] = "79de0b981dd8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column(
        "users",
        "id",
        existing_type=sa.VARCHAR(),
        type_=sa.UUID(),
        postgresql_using="id::uuid",
        server_default=sa.text("gen_random_uuid()"),
        existing_nullable=False,
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column(
        "users",
        "id",
        existing_type=sa.UUID(),
        type_=sa.VARCHAR(),
        postgresql_using="id::text",
        server_default=None,
        existing_nullable=False,
    )
    # ### end Alembic commands ###
