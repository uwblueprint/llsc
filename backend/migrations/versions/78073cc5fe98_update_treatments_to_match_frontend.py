"""update_treatments_to_match_frontend

Revision ID: 78073cc5fe98
Revises: 55934750df90
Create Date: 2025-07-13 16:23:01.195384

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "78073cc5fe98"
down_revision: Union[str, None] = "55934750df90"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Update treatments to match frontend expectations
    connection = op.get_bind()

    # Clear existing treatments and insert new ones
    connection.execute(sa.text("DELETE FROM user_treatments"))
    connection.execute(sa.text("DELETE FROM user_loved_one_treatments"))
    connection.execute(sa.text("DELETE FROM treatments"))

    # Insert updated treatments that match frontend
    treatments = [
        (1, "Chemotherapy"),
        (2, "Immunotherapy"),
        (3, "Radiation Therapy"),
        (4, "Surgery"),
        (5, "Targeted Therapy"),
        (6, "Hormone Therapy"),
        (7, "Stem Cell Transplant"),
        (8, "CAR-T Cell Therapy"),
        (9, "Clinical Trial"),
        (10, "Palliative Care"),
        (11, "Supportive Care"),
        (12, "Watchful Waiting"),
        (13, "Maintenance Therapy"),
        (14, "Combination Therapy"),
        (15, "Experimental Treatment"),
    ]

    for treatment_id, treatment_name in treatments:
        connection.execute(
            sa.text("INSERT INTO treatments (id, name) VALUES (:id, :name)"),
            {"id": treatment_id, "name": treatment_name},
        )


def downgrade() -> None:
    # Restore original treatments
    connection = op.get_bind()

    # Clear current treatments
    connection.execute(sa.text("DELETE FROM user_treatments"))
    connection.execute(sa.text("DELETE FROM user_loved_one_treatments"))
    connection.execute(sa.text("DELETE FROM treatments"))

    # Insert original treatments
    original_treatments = [
        (1, "Chemotherapy"),
        (2, "Immunotherapy"),
        (3, "Radiation Therapy"),
        (4, "Surgery"),
        (5, "Targeted Therapy"),
        (6, "Hormone Therapy"),
        (7, "Stem Cell Transplant"),
        (8, "CAR-T Cell Therapy"),
        (9, "Clinical Trial"),
        (10, "Palliative Care"),
    ]

    for treatment_id, treatment_name in original_treatments:
        connection.execute(
            sa.text("INSERT INTO treatments (id, name) VALUES (:id, :name)"),
            {"id": treatment_id, "name": treatment_name},
        )
