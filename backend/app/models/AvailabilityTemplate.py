from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .Base import Base


class AvailabilityTemplate(Base):
    """
    Stores recurring weekly availability patterns for volunteers.
    Each template represents a time slot on a specific day of the week.
    These templates are projected forward to create specific TimeBlocks for matches.
    """

    __tablename__ = "availability_templates"

    id = Column(Integer, primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Day of week: 0=Monday, 1=Tuesday, ..., 6=Sunday
    day_of_week = Column(Integer, nullable=False)

    # Time of day (just time, no date)
    start_time = Column(Time, nullable=False)  # e.g., 14:00:00
    end_time = Column(Time, nullable=False)  # e.g., 16:00:00

    # Optional: for future enhancements (e.g., temporarily disable a template)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="availability_templates")
