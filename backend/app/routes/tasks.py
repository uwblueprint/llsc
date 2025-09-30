"""
API routes for task management.
Provides endpoints for creating, retrieving, updating, and completing tasks.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.middleware.auth import has_roles
from app.models.Task import TaskPriority, TaskStatus, TaskType
from app.models.User import User
from app.schemas.task import (
    TaskAssignRequest,
    TaskCompleteRequest,
    TaskCreateRequest,
    TaskListResponse,
    TaskResponse,
    TaskUpdateRequest,
)
from app.schemas.user import UserRole
from app.services.task_service import TaskService
from app.utilities.db_utils import get_db

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"],
)


@router.post("", response_model=TaskResponse)
async def create_task(
    task: TaskCreateRequest,
    request: Request,
    db: Session = Depends(get_db),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    """
    Create a new task manually (admin only).

    This endpoint is primarily for testing or manual task creation.
    In production, tasks are typically created automatically by other services.
    """
    try:
        # Verify participant exists
        participant = db.query(User).filter(User.id == task.participant_id).first()
        if not participant:
            raise HTTPException(status_code=404, detail="Participant not found")

        # Verify assignee exists if provided
        if task.assignee_id:
            assignee = db.query(User).filter(User.id == task.assignee_id).first()
            if not assignee:
                raise HTTPException(status_code=404, detail="Assignee not found")
            if assignee.role.name != "admin":
                raise HTTPException(status_code=400, detail="Assignee must be an admin")

        # Create task
        created_task = TaskService.create_task(
            db=db,
            participant_id=task.participant_id,
            task_type=task.type,
            priority=task.priority,
            assignee_id=task.assignee_id,
            end_date=task.end_date,
            task_metadata=task.task_metadata,
        )

        db.commit()
        db.refresh(created_task)

        return TaskResponse.model_validate(created_task)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating task: {str(e)}")


@router.get("", response_model=TaskListResponse)
async def get_tasks(
    participant_id: Optional[UUID] = Query(None, description="Filter by participant ID"),
    assignee_id: Optional[UUID] = Query(None, description="Filter by assignee ID"),
    task_type: Optional[TaskType] = Query(None, description="Filter by task type"),
    status: Optional[TaskStatus] = Query(None, description="Filter by status"),
    priority: Optional[TaskPriority] = Query(None, description="Filter by priority"),
    db: Session = Depends(get_db),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    """
    Get all tasks with optional filters (admin only).

    Filters can be combined to narrow down results.
    """
    try:
        tasks = TaskService.get_tasks(
            db=db,
            participant_id=participant_id,
            assignee_id=assignee_id,
            task_type=task_type,
            status=status,
            priority=priority,
        )

        return TaskListResponse(
            tasks=[TaskResponse.model_validate(t) for t in tasks],
            total=len(tasks),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving tasks: {str(e)}")


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: UUID,
    db: Session = Depends(get_db),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    """
    Get a specific task by ID (admin only).
    """
    try:
        task = TaskService.get_task_by_id(db=db, task_id=task_id)

        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        return TaskResponse.model_validate(task)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving task: {str(e)}")


@router.put("/{task_id}/assign", response_model=TaskResponse)
async def assign_task(
    task_id: UUID,
    assign_request: TaskAssignRequest,
    db: Session = Depends(get_db),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    """
    Assign a task to an admin (admin only).
    """
    try:
        # Verify assignee exists and is admin
        assignee = db.query(User).filter(User.id == assign_request.assignee_id).first()
        if not assignee:
            raise HTTPException(status_code=404, detail="Assignee not found")
        if assignee.role.name != "admin":
            raise HTTPException(status_code=400, detail="Assignee must be an admin")

        # Assign task
        task = TaskService.assign_task(
            db=db,
            task_id=task_id,
            assignee_id=assign_request.assignee_id,
        )

        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        db.commit()
        db.refresh(task)

        return TaskResponse.model_validate(task)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error assigning task: {str(e)}")


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: UUID,
    update_request: TaskUpdateRequest,
    db: Session = Depends(get_db),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    """
    Update task details (admin only).

    Can update priority, assignee, end_date, status, and metadata.
    """
    try:
        # If updating assignee, verify they exist and are admin
        if update_request.assignee_id:
            assignee = db.query(User).filter(User.id == update_request.assignee_id).first()
            if not assignee:
                raise HTTPException(status_code=404, detail="Assignee not found")
            if assignee.role.name != "admin":
                raise HTTPException(status_code=400, detail="Assignee must be an admin")

        # Update task
        task = TaskService.update_task(
            db=db,
            task_id=task_id,
            priority=update_request.priority,
            assignee_id=update_request.assignee_id,
            end_date=update_request.end_date,
            status=update_request.status,
            task_metadata=update_request.task_metadata,
        )

        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        db.commit()
        db.refresh(task)

        return TaskResponse.model_validate(task)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating task: {str(e)}")


@router.post("/{task_id}/complete", response_model=TaskResponse)
async def complete_task(
    task_id: UUID,
    complete_request: TaskCompleteRequest,
    db: Session = Depends(get_db),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    """
    Mark a task as completed (admin only).
    """
    try:
        task = TaskService.complete_task(db=db, task_id=task_id)

        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        db.commit()
        db.refresh(task)

        return TaskResponse.model_validate(task)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error completing task: {str(e)}")
