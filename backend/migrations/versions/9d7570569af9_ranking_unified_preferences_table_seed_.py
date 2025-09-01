"""ranking: unified preferences table + seed qualities

Revision ID: 9d7570569af9
Revises: fb0638c24174
Create Date: 2025-08-31 20:49:12.042730

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '9d7570569af9'
down_revision: Union[str, None] = 'fb0638c24174'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop legacy ranking_preferences table if it exists
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if 'ranking_preferences' in inspector.get_table_names():
        op.drop_table('ranking_preferences')

    # Create ENUM types
    target_role_enum = postgresql.ENUM('patient', 'caregiver', name='target_role', create_type=False)
    kind_enum = postgresql.ENUM('quality', 'treatment', 'experience', name='ranking_kind', create_type=False)
    scope_enum = postgresql.ENUM('self', 'loved_one', name='ranking_scope', create_type=False)
    target_role_enum.create(bind, checkfirst=True)
    kind_enum.create(bind, checkfirst=True)
    scope_enum.create(bind, checkfirst=True)

    # Create unified ranking_preferences table
    op.create_table(
        'ranking_preferences',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('target_role', target_role_enum, nullable=False),
        sa.Column('kind', kind_enum, nullable=False),
        sa.Column('quality_id', sa.Integer(), nullable=True),
        sa.Column('treatment_id', sa.Integer(), nullable=True),
        sa.Column('experience_id', sa.Integer(), nullable=True),
        sa.Column('scope', scope_enum, nullable=False),
        sa.Column('rank', sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint('user_id', 'target_role', 'kind', 'quality_id', 'treatment_id', 'experience_id', 'scope'),
    )

    # Add check constraints to enforce exclusivity by kind
    op.create_check_constraint(
        'ck_ranking_pref_quality_fields',
        'ranking_preferences',
        "(kind <> 'quality') OR (quality_id IS NOT NULL AND treatment_id IS NULL AND experience_id IS NULL AND scope IS NOT NULL)",
    )
    op.create_check_constraint(
        'ck_ranking_pref_treatment_fields',
        'ranking_preferences',
        "(kind <> 'treatment') OR (treatment_id IS NOT NULL AND quality_id IS NULL AND experience_id IS NULL AND scope IS NOT NULL)",
    )
    op.create_check_constraint(
        'ck_ranking_pref_experience_fields',
        'ranking_preferences',
        "(kind <> 'experience') OR (experience_id IS NOT NULL AND quality_id IS NULL AND treatment_id IS NULL AND scope IS NOT NULL)",
    )

    # Helpful indexes
    op.create_index('ix_ranking_pref_user_target', 'ranking_preferences', ['user_id', 'target_role'])
    op.create_index('ix_ranking_pref_user_kind', 'ranking_preferences', ['user_id', 'kind'])

    # Seed qualities (idempotent) using slug/label pairs
    # Using plain SQL for ON CONFLICT DO NOTHING
    qualities = [
        ('same_age', 'the same age as'),
        ('same_gender_identity', 'the same gender identity as'),
        ('same_ethnic_or_cultural_group', 'same ethnic or cultural group as'),
        ('same_marital_status', 'the same marital status as'),
        ('same_parental_status', 'the same parental status as'),
        ('same_diagnosis', 'the same diagnosis as'),
    ]
    conn = op.get_bind()
    # Ensure the sequence is aligned to current MAX(id) to avoid PK conflicts
    conn.execute(
        sa.text(
            "SELECT setval(pg_get_serial_sequence('qualities','id'), "
            "COALESCE((SELECT MAX(id) FROM qualities), 0))"
        )
    )
    # First update labels for any existing slugs
    for slug, label in qualities:
        conn.execute(
            sa.text("UPDATE qualities SET label = :label WHERE slug = :slug"),
            {"slug": slug, "label": label},
        )
    # Then insert any missing slugs
    for slug, label in qualities:
        conn.execute(
            sa.text(
                "INSERT INTO qualities (slug, label) "
                "SELECT :slug, :label WHERE NOT EXISTS (SELECT 1 FROM qualities WHERE slug = :slug)"
            ),
            {"slug": slug, "label": label},
        )


def downgrade() -> None:
    # Drop unified table
    op.drop_index('ix_ranking_pref_user_kind', table_name='ranking_preferences')
    op.drop_index('ix_ranking_pref_user_target', table_name='ranking_preferences')
    op.drop_constraint('ck_ranking_pref_experience_fields', 'ranking_preferences', type_='check')
    op.drop_constraint('ck_ranking_pref_treatment_fields', 'ranking_preferences', type_='check')
    op.drop_constraint('ck_ranking_pref_quality_fields', 'ranking_preferences', type_='check')
    op.drop_table('ranking_preferences')

    # Drop ENUMs if present
    bind = op.get_bind()
    target_role_enum = postgresql.ENUM('patient', 'caregiver', name='target_role')
    kind_enum = postgresql.ENUM('quality', 'treatment', 'experience', name='ranking_kind')
    scope_enum = postgresql.ENUM('self', 'loved_one', name='ranking_scope')
    scope_enum.drop(bind, checkfirst=True)
    kind_enum.drop(bind, checkfirst=True)
    target_role_enum.drop(bind, checkfirst=True)
