"""add_loved_one_fields_to_userdata

Revision ID: 55934750df90
Revises: 62d18260aaed
Create Date: 2025-07-13 16:22:01.195384

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '55934750df90'
down_revision: Union[str, None] = '62d18260aaed'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add loved one demographics fields to user_data
    op.add_column('user_data', sa.Column('loved_one_gender_identity', sa.String(50), nullable=True))
    op.add_column('user_data', sa.Column('loved_one_age', sa.String(10), nullable=True))
    
    # Add loved one cancer experience fields to user_data
    op.add_column('user_data', sa.Column('loved_one_diagnosis', sa.String(100), nullable=True))
    op.add_column('user_data', sa.Column('loved_one_date_of_diagnosis', sa.Date(), nullable=True))
    op.add_column('user_data', sa.Column('loved_one_other_treatment', sa.Text(), nullable=True))
    op.add_column('user_data', sa.Column('loved_one_other_experience', sa.Text(), nullable=True))
    
    # Create bridge table for user loved one treatments
    op.create_table(
        'user_loved_one_treatments',
        sa.Column('user_data_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('treatment_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['treatment_id'], ['treatments.id'], ),
        sa.ForeignKeyConstraint(['user_data_id'], ['user_data.id'], ),
        sa.PrimaryKeyConstraint('user_data_id', 'treatment_id')
    )
    
    # Create bridge table for user loved one experiences
    op.create_table(
        'user_loved_one_experiences',
        sa.Column('user_data_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('experience_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['experience_id'], ['experiences.id'], ),
        sa.ForeignKeyConstraint(['user_data_id'], ['user_data.id'], ),
        sa.PrimaryKeyConstraint('user_data_id', 'experience_id')
    )


def downgrade() -> None:
    # Drop bridge tables
    op.drop_table('user_loved_one_experiences')
    op.drop_table('user_loved_one_treatments')
    
    # Drop loved one fields from user_data
    op.drop_column('user_data', 'loved_one_other_experience')
    op.drop_column('user_data', 'loved_one_other_treatment')
    op.drop_column('user_data', 'loved_one_date_of_diagnosis')
    op.drop_column('user_data', 'loved_one_diagnosis')
    op.drop_column('user_data', 'loved_one_age')
    op.drop_column('user_data', 'loved_one_gender_identity')
