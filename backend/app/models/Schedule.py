import uuid

from sqlalchemy import Column, DateTime, Enum, Interval
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .Base import Base

schedule_state_enum = Enum(
    "PENDING_PARTICIPANT_RESPONSE",
    "PENDING_VOLUNTEER_RESPONSE",
    "SCHEDULED",
    "COMPLETED",
    name = "state"
)

class Schedule(Base):
    __tablename__ = "schedules"

    scheduleId = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scheduledTime = Column(DateTime, nullable = False)
    duration = Column(Interval, nullable = False)
    state = Column(schedule_state_enum, nullable = False)

    time_blocks = relationship("TimeBlock", back_populates="schedule")
