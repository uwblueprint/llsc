import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Column, DateTime, ForeignKey, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .Base import Base


class TaskType(str, PyEnum):
    INTAKE_FORM_REVIEW = "intake_form_review"
    VOLUNTEER_APP_REVIEW = "volunteer_app_review"
    PROFILE_UPDATE = "profile_update"
    MATCHING = "matching"


class TaskPriority(str, PyEnum):
    NO_STATUS = "no_status"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TaskStatus(str, PyEnum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    participant_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    type = Column(
        SQLEnum(
            TaskType,
            name="task_type_enum",
            create_type=False,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
    )
    priority = Column(
        SQLEnum(
            TaskPriority,
            name="task_priority_enum",
            create_type=False,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
        default=TaskPriority.NO_STATUS,
    )
    status = Column(
        SQLEnum(
            TaskStatus,
            name="task_status_enum",
            create_type=False,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
        default=TaskStatus.PENDING,
    )
    assignee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    start_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    description = Column(Text, nullable=True)

    # Relationships
    participant = relationship("User", foreign_keys=[participant_id], backref="participant_tasks")
    assignee = relationship("User", foreign_keys=[assignee_id], backref="assigned_tasks")
