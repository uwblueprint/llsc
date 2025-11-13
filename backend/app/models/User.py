import uuid
from enum import Enum as PyEnum

from sqlalchemy import Boolean, Column, ForeignKey, Integer, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .Base import Base
from .Match import Match


class FormStatus(str, PyEnum):
    INTAKE_TODO = "intake-todo"
    INTAKE_SUBMITTED = "intake-submitted"
    RANKING_TODO = "ranking-todo"
    RANKING_SUBMITTED = "ranking-submitted"
    SECONDARY_APPLICATION_TODO = "secondary-application-todo"
    SECONDARY_APPLICATION_SUBMITTED = "secondary-application-submitted"
    COMPLETED = "completed"
    REJECTED = "rejected"


class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = Column(Text, nullable=True)
    last_name = Column(Text, nullable=True)
    email = Column(Text, unique=True, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    auth_id = Column(Text, nullable=False)
    approved = Column(Boolean, default=False)
    active = Column(Boolean, nullable=False, default=True)
    pending_volunteer_request = Column(Boolean, nullable=False, default=False)
    form_status = Column(
        SQLEnum(
            FormStatus,
            name="form_status_enum",
            create_type=False,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
        default=FormStatus.INTAKE_TODO,
    )

    role = relationship("Role")

    # time blocks in an availability for a user
    availability = relationship("TimeBlock", secondary="available_times", back_populates="users")

    participant_matches = relationship("Match", back_populates="participant", foreign_keys=[Match.participant_id])

    volunteer_matches = relationship("Match", back_populates="volunteer", foreign_keys=[Match.volunteer_id])

    volunteer_data = relationship("VolunteerData", back_populates="user", uselist=False)

    user_data = relationship("UserData", back_populates="user", uselist=False)
