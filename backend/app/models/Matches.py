import enum
import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .Base import Base


class MatchStatus(enum.Enum):
    PENDING_ADMIN_APPROVAL = "pending_admin_approval"
    APPROVED = "approved"
    REJECTED = "rejected"


class ScheduleStatus(enum.Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    DECLINED = "declined"  # This status is for when a user declines a scheduled match
    PENDING_PARTICIPANT_RESPONSE = "pending_participant_response"
    PENDING_VOLUNTEER_RESPONSE = "pending_volunteer_response"
    CANCELLED = "cancelled"  # This status is for when a match is cancelled by an admin


class Matches(Base):
    __tablename__ = "matches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    participant_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    volunteer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    match_status = Column(
        Enum(MatchStatus), nullable=True, default=MatchStatus.PENDING_ADMIN_APPROVAL
    )
    schedule_status = Column(Enum(ScheduleStatus), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    participant = relationship("User", foreign_keys=[participant_id])
    volunteer = relationship("User", foreign_keys=[volunteer_id])
