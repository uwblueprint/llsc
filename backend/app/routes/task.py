from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from app.middleware.auth import has_roles
from app.schemas.task import (
    TaskAssignRequest,
    TaskCreateRequest,
    TaskListResponse,
    TaskResponse,
    TaskUpdateRequest,
)
from app.schemas.user import UserRole
from app.services.implementations.task_service import TaskService
from app.utilities.service_utils import get_task_service

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"],
)


@router.post("", response_model=TaskResponse)
async def create_task(
    task: TaskCreateRequest,
    task_service: TaskService = Depends(get_task_service),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    """
    Create a new task (admin only).
    This endpoint can also be called internally from other services to automatically create tasks.
    """
    try:
        return await task_service.create_task(task)
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=TaskListResponse)
async def get_tasks(
    status: Optional[str] = Query(None, description="Filter by task status"),
    priority: Optional[str] = Query(None, description="Filter by task priority"),
    task_type: Optional[str] = Query(None, description="Filter by task type"),
    assignee_id: Optional[str] = Query(None, description="Filter by assignee ID"),
    task_service: TaskService = Depends(get_task_service),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    """
    Get all tasks with optional filters (admin only)
    """
    try:
        assignee_uuid = UUID(assignee_id) if assignee_id else None
        tasks = await task_service.get_all_tasks(
            status=status, priority=priority, task_type=task_type, assignee_id=assignee_uuid
        )
        return TaskListResponse(tasks=tasks, total=len(tasks))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid assignee_id format")
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    task_service: TaskService = Depends(get_task_service),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    """
    Get a single task by ID (admin only)
    """
    try:
        return await task_service.get_task_by_id(UUID(task_id))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID format")
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_update: TaskUpdateRequest,
    task_service: TaskService = Depends(get_task_service),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    """
    Update a task (admin only)
    """
    try:
        return await task_service.update_task(UUID(task_id), task_update)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID format")
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{task_id}/assign", response_model=TaskResponse)
async def assign_task(
    task_id: str,
    assign_request: TaskAssignRequest,
    task_service: TaskService = Depends(get_task_service),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    """
    Assign a task to an admin user (admin only)
    """
    try:
        return await task_service.assign_task(UUID(task_id), assign_request.assignee_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID format")
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{task_id}/complete", response_model=TaskResponse)
async def complete_task(
    task_id: str,
    task_service: TaskService = Depends(get_task_service),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    """
    Mark a task as completed (admin only)
    """
    try:
        return await task_service.complete_task(UUID(task_id))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID format")
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    task_service: TaskService = Depends(get_task_service),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    """
    Delete a task (admin only)
    """
    try:
        await task_service.delete_task(UUID(task_id))
        return {"message": "Task deleted successfully"}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID format")
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
