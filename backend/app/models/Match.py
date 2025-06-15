
from sqlalchemy import Column, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .Base import Base


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True)

    participant_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    volunteer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # the chosen time block
    chosen_time_block_id = Column(Integer, ForeignKey("time_blocks.id"), nullable=True)

    match_status_id = Column(
        Integer, ForeignKey("match_status.id"), nullable=False, default=1
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    match_status = relationship("MatchStatus")

    participant = relationship(
        "User", foreign_keys=[participant_id], back_populates="participant_matches"
    )
    volunteer = relationship(
        "User", foreign_keys=[volunteer_id], back_populates="volunteer_matches"
    )

    confirmed_time = relationship(
        "TimeBlock", back_populates="confirmed_match", uselist=False
    )
    suggested_time_blocks = relationship(
        "TimeBlock", secondary="suggested_times", back_populates="suggested_matches"
    )
