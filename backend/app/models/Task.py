import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from .Base import Base


class TaskType(str, enum.Enum):
    """Types of tasks that can be created"""

    INTAKE_FORM_REVIEW = "intake_form_review"
    VOLUNTEER_APP_REVIEW = "volunteer_app_review"
    PROFILE_UPDATE = "profile_update"
    MATCHING = "matching"


class TaskPriority(str, enum.Enum):
    """Priority levels for tasks"""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    NO_STATUS = "no_status"


class TaskStatus(str, enum.Enum):
    """Status of a task"""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    participant_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(Enum(TaskType, name="task_type"), nullable=False)
    priority = Column(Enum(TaskPriority, name="task_priority"), nullable=False, default=TaskPriority.NO_STATUS)
    assignee_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    end_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(Enum(TaskStatus, name="task_status"), nullable=False, default=TaskStatus.PENDING)
    task_metadata = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    participant = relationship("User", foreign_keys=[participant_id], backref="participant_tasks")
    assignee = relationship("User", foreign_keys=[assignee_id], backref="assigned_tasks")