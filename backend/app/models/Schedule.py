import uuid

from sqlalchemy import Column, DateTime, Enum, Interval, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.models.ScheduleStatus import ScheduleStatus

from .Base import Base


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True)
    scheduled_time = Column(DateTime, nullable = True)
    duration = Column(Interval, nullable = True)
    status_id = Column(Integer, ForeignKey("schedule_status.id"), nullable=False)

    status = relationship("ScheduleStatus")
    time_blocks = relationship("TimeBlock", back_populates="schedule")
