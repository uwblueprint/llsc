from sqlalchemy import Column, DateTime, Integer
from sqlalchemy.orm import relationship

from .Base import Base


class TimeBlock(Base):
    __tablename__ = "time_blocks"
    id = Column(Integer, primary_key=True)
    start_time = Column(DateTime(timezone=True))

    # if a match has been confirmed on this time block, this is non null
    confirmed_match = relationship("Match", back_populates="confirmed_time", uselist=False)

    # suggested matches
    suggested_matches = relationship("Match", secondary="suggested_times", back_populates="suggested_time_blocks")

    # the availability that the timeblock is a part of for a given user
    users = relationship("User", secondary="available_times", back_populates="availability")
