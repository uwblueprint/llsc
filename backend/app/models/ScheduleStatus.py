from sqlalchemy import Column, Integer, String

from .Base import Base


class ScheduleStatus(Base):
    __tablename__ = "schedule_status"
    id = Column(Integer, primary_key=True)
    name = Column(String(80), nullable=False)
