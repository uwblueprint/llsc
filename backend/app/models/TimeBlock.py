import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .Base import Base


class TimeBlock(Base):
    __tablename__ = "time_blocks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    schedule_id = Column(Integer, ForeignKey("schedules.id"), nullable = False)
    start_time = Column(DateTime)
    end_time = Column(DateTime)

    schedule = relationship("Schedule", back_populates="time_blocks")

