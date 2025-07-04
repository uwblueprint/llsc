"""add Match, MatchStatus, SuggestedTime, AvailableTime. delete Schedule, ScheduleStatus

Revision ID: d6ee93e07a70
Revises: df571b763807
Create Date: 2025-03-11 21:11:38.464490

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "d6ee93e07a70"
down_revision: Union[str, None] = "df571b763807"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table(
        "match_status",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.bulk_insert(
        sa.table(
            "match_status",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("name", sa.String(length=80), nullable=False),
        ),
        [
            {"id": 1, "name": "PENDING_ADMIN_APPROVAL"},
            {"id": 2, "name": "APPROVED"},
            {"id": 3, "name": "REJECTED"},
            {"id": 4, "name": "PENDING_PARTICIPANT_RESPONSE"},
            {"id": 5, "name": "PENDING_VOLUNTEER_RESPONSE"},
            {"id": 6, "name": "SCHEDULED"},
            {"id": 7, "name": "DECLINED"},
            {"id": 8, "name": "CANCELLED"},
            {"id": 9, "name": "COMPLETED"},
        ],
    )
    op.create_table(
        "available_times",
        sa.Column("time_block_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(
            ["time_block_id"],
            ["time_blocks.id"],
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("time_block_id", "user_id"),
    )
    op.create_table(
        "matches",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("participant_id", sa.UUID(), nullable=False),
        sa.Column("volunteer_id", sa.UUID(), nullable=False),
        sa.Column("chosen_time_block_id", sa.Integer(), nullable=True),
        sa.Column("match_status_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(
            ["chosen_time_block_id"],
            ["time_blocks.id"],
        ),
        sa.ForeignKeyConstraint(
            ["match_status_id"],
            ["match_status.id"],
        ),
        sa.ForeignKeyConstraint(
            ["participant_id"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["volunteer_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "suggested_times",
        sa.Column("match_id", sa.Integer(), nullable=False),
        sa.Column("time_block_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["match_id"],
            ["matches.id"],
        ),
        sa.ForeignKeyConstraint(
            ["time_block_id"],
            ["time_blocks.id"],
        ),
        sa.PrimaryKeyConstraint("match_id", "time_block_id"),
    )
    op.drop_constraint("time_blocks_schedule_id_fkey", "time_blocks", type_="foreignkey")
    op.drop_column("time_blocks", "schedule_id")
    op.drop_column("time_blocks", "end_time")
    op.drop_table("schedules")
    op.drop_table("schedule_status")
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column("time_blocks", sa.Column("end_time", postgresql.TIMESTAMP(), autoincrement=False, nullable=True))
    op.add_column("time_blocks", sa.Column("schedule_id", sa.INTEGER(), autoincrement=False, nullable=False))
    op.create_foreign_key("time_blocks_schedule_id_fkey", "time_blocks", "schedules", ["schedule_id"], ["id"])
    op.create_table(
        "schedule_status",
        sa.Column(
            "id",
            sa.INTEGER(),
            server_default=sa.text("nextval('schedule_status_id_seq'::regclass)"),
            autoincrement=True,
            nullable=False,
        ),
        sa.Column("name", sa.VARCHAR(length=80), autoincrement=False, nullable=False),
        sa.PrimaryKeyConstraint("id", name="schedule_status_pkey"),
        postgresql_ignore_search_path=False,
    )
    op.create_table(
        "schedules",
        sa.Column("id", sa.INTEGER(), autoincrement=True, nullable=False),
        sa.Column("scheduled_time", postgresql.TIMESTAMP(), autoincrement=False, nullable=True),
        sa.Column("duration", postgresql.INTERVAL(), autoincrement=False, nullable=True),
        sa.Column("status_id", sa.INTEGER(), autoincrement=False, nullable=False),
        sa.ForeignKeyConstraint(["status_id"], ["schedule_status.id"], name="schedules_status_id_fkey"),
        sa.PrimaryKeyConstraint("id", name="schedules_pkey"),
    )
    op.drop_table("suggested_times")
    op.drop_table("matches")
    op.drop_table("available_times")
    op.drop_table("match_status")
    # ### end Alembic commands ###
