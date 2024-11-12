import uuid
from sqlalchemy import Column, Enum, DateTime, Interval
from sqlalchemy.dialects.postgresql import UUID

from .Base import Base

schedule_state_enum = Enum(
    "PENDING_PARTICIPANT_RESPONSE",
    "PENDING_VOLUNTEER_RESPONSE",
    "SCHEDULED",
    "COMPLETED",
    name = "state"
)

class Schedules(Base):
    __tablename__ = "schedules"

    scheduleId = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scheduledTime = Column(DateTime, nullable = False)
    duration = Column(Interval, nullable = False)
    state = Column(schedule_state_enum, nullable = False)
