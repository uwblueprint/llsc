"""
Pydantic schemas for task-related data validation and serialization.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.Task import TaskPriority, TaskStatus, TaskType


class TaskCreateRequest(BaseModel):
    """Request schema for creating a task manually (admin only)"""

    participant_id: UUID = Field(..., description="ID of the participant this task is for")
    type: TaskType = Field(..., description="Type of task")
    priority: TaskPriority = Field(default=TaskPriority.NO_STATUS, description="Priority level")
    assignee_id: Optional[UUID] = Field(None, description="ID of admin assigned to this task")
    end_date: Optional[datetime] = Field(None, description="Target completion date")
    task_metadata: Optional[dict] = Field(None, description="Additional task metadata")


class TaskUpdateRequest(BaseModel):
    """Request schema for updating a task"""

    priority: Optional[TaskPriority] = Field(None, description="Updated priority level")
    assignee_id: Optional[UUID] = Field(None, description="Updated assignee ID")
    end_date: Optional[datetime] = Field(None, description="Updated target completion date")
    status: Optional[TaskStatus] = Field(None, description="Updated status")
    task_metadata: Optional[dict] = Field(None, description="Updated metadata")


class TaskAssignRequest(BaseModel):
    """Request schema for assigning a task to an admin"""

    assignee_id: UUID = Field(..., description="ID of admin to assign this task to")


class TaskCompleteRequest(BaseModel):
    """Request schema for completing a task"""

    pass  # No additional fields needed, just marks task as completed


class TaskResponse(BaseModel):
    """Response schema for task data"""

    id: UUID
    participant_id: UUID
    type: TaskType
    priority: TaskPriority
    assignee_id: Optional[UUID]
    start_date: datetime
    end_date: Optional[datetime]
    status: TaskStatus
    task_metadata: Optional[dict]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TaskListResponse(BaseModel):
    """Response schema for listing tasks"""

    tasks: List[TaskResponse]
    total: int