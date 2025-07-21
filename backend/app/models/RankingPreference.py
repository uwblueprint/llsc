from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .Base import Base


class RankingPreference(Base):
    __tablename__ = "ranking_preferences"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    quality_id = Column(Integer, ForeignKey("qualities.id"), primary_key=True)
    rank = Column(Integer, nullable=False)  # 1 = most important

    # Relationships
    user = relationship("User")
    quality = relationship("Quality")
