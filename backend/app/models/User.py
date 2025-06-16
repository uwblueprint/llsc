import uuid

from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .Base import Base
from .Match import Match


class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = Column(String(80), nullable=False)
    last_name = Column(String(80), nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    auth_id = Column(String, nullable=False)
    approved = Column(Boolean, default=False)

    role = relationship("Role")

    # time blocks in an availability for a user
    availability = relationship("TimeBlock", secondary="available_times", back_populates="users")

    participant_matches = relationship("Match", back_populates="participant", foreign_keys=[Match.participant_id])

    volunteer_matches = relationship("Match", back_populates="volunteer", foreign_keys=[Match.volunteer_id])
