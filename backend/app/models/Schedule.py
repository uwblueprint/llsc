import uuid

from sqlalchemy import Column, DateTime, Enum, Interval, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .Base import Base


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scheduled_time = Column(DateTime, nullable = True)
    duration = Column(Interval, nullable = True)
    state_id = Column(Integer, ForeignKey("schedule_states.id"), nullable=False)

    state = relationship("State")
    time_blocks = relationship("TimeBlock", back_populates="schedule")
