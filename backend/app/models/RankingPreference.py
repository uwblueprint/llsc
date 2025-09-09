from sqlalchemy import CheckConstraint, Column, Enum, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .Base import Base


class RankingPreference(Base):
    __tablename__ = "ranking_preferences"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    # patient or caregiver (the counterpart the participant is ranking for)
    target_role = Column(Enum("patient", "caregiver", name="target_role"), primary_key=True)

    # kind of item: quality, treatment, or experience
    kind = Column(Enum("quality", "treatment", "experience", name="ranking_kind"))

    # one of these will be set based on kind
    quality_id = Column(Integer, nullable=True)
    treatment_id = Column(Integer, nullable=True)
    experience_id = Column(Integer, nullable=True)

    # scope: self or loved_one; always required (including qualities)
    scope = Column(Enum("self", "loved_one", name="ranking_scope"), nullable=False)

    # rank: 1 is highest
    rank = Column(Integer, nullable=False, primary_key=True)

    # relationships
    user = relationship("User")

    __table_args__ = (
        # enforce exclusive columns by kind
        CheckConstraint(
            "(kind <> 'quality') OR (quality_id IS NOT NULL AND treatment_id IS NULL AND experience_id IS NULL)",
            name="ck_ranking_pref_quality_fields",
        ),
        CheckConstraint(
            "(kind <> 'treatment') OR (treatment_id IS NOT NULL AND quality_id IS NULL AND experience_id IS NULL)",
            name="ck_ranking_pref_treatment_fields",
        ),
        CheckConstraint(
            "(kind <> 'experience') OR (experience_id IS NOT NULL AND quality_id IS NULL AND treatment_id IS NULL)",
            name="ck_ranking_pref_experience_fields",
        ),
    )
