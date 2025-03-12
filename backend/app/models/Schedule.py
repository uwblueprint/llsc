from sqlalchemy import Column, DateTime, ForeignKey, Integer, Interval
from sqlalchemy.orm import relationship

from .Base import Base


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True)
    scheduled_time = Column(DateTime, nullable=True)
    duration = Column(Interval, nullable=True)
    status_id = Column(Integer, ForeignKey("schedule_status.id"), nullable=False)

    status = relationship("ScheduleStatus")
    time_blocks = relationship("TimeBlock", back_populates="schedule")
