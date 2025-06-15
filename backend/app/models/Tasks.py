import enum
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .Base import Base


class PriorityEnum(enum.Enum):
    NONE = "None"
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True)
    task_type_id = Column(Integer, ForeignKey("task_types.id"), nullable=False)
    participant_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    start_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    priority = Column(
        Enum(PriorityEnum, name="priority_enum"),
        nullable=False,
        default=PriorityEnum.NONE,
    )
    assignee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    is_completed = Column(Boolean, nullable=False, default=False)

    # Relationships
    task_type = relationship("TaskType")
    participant = relationship("User", foreign_keys=[participant_id])
    assignee = relationship("User", foreign_keys=[assignee_id])
