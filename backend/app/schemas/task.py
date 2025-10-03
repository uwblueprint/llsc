"""
Pydantic schemas for task-related data validation and serialization.
Handles task CRUD and response models for the API.
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TaskType(str, Enum):
    """
    Enum for task types.
    """

    INTAKE_FORM_REVIEW = "intake_form_review"
    VOLUNTEER_APP_REVIEW = "volunteer_app_review"
    PROFILE_UPDATE = "profile_update"
    MATCHING = "matching"


class TaskPriority(str, Enum):
    """
    Enum for task priorities.
    """

    NO_STATUS = "no_status"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TaskStatus(str, Enum):
    """
    Enum for task status.
    """

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class TaskBase(BaseModel):
    """
    Base schema for task model with common attributes shared across schemas.
    """

    participant_id: Optional[UUID] = None
    type: TaskType
    priority: TaskPriority = TaskPriority.NO_STATUS
    status: TaskStatus = TaskStatus.PENDING
    assignee_id: Optional[UUID] = None
    start_date: datetime = Field(default_factory=datetime.utcnow)
    end_date: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TaskCreateRequest(BaseModel):
    """
    Request schema for task creation.
    """

    participant_id: Optional[UUID] = None
    type: TaskType
    priority: TaskPriority = TaskPriority.NO_STATUS
    assignee_id: Optional[UUID] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class TaskUpdateRequest(BaseModel):
    """
    Request schema for task updates, all fields optional.
    """

    participant_id: Optional[UUID] = None
    type: Optional[TaskType] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    assignee_id: Optional[UUID] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class TaskAssignRequest(BaseModel):
    """
    Request schema for assigning a task to an admin.
    """

    assignee_id: UUID


class TaskResponse(BaseModel):
    """
    Response schema for task data.
    """

    id: UUID
    participant_id: Optional[UUID]
    type: TaskType
    priority: TaskPriority
    status: TaskStatus
    assignee_id: Optional[UUID]
    start_date: datetime
    end_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskListResponse(BaseModel):
    """
    Response schema for listing tasks.
    """

    tasks: List[TaskResponse]
    total: int
