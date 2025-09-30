"""
Service layer for task management operations.
Provides business logic for creating, updating, and managing tasks.
"""

from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.Task import Task, TaskPriority, TaskStatus, TaskType


class TaskService:
    """Service class for task operations"""

    @staticmethod
    def create_task(
        db: Session,
        participant_id: UUID,
        task_type: TaskType,
        task_metadata: Optional[Dict] = None,
        priority: TaskPriority = TaskPriority.NO_STATUS,
        assignee_id: Optional[UUID] = None,
        end_date: Optional[datetime] = None,
    ) -> Task:
        """
        Create a new task.

        This method can be called from other parts of the application
        to automatically create tasks when certain events occur.

        Args:
            db: Database session
            participant_id: ID of the participant
            task_type: Type of task
            task_metadata: Optional metadata (e.g., form_submission_id, match_id)
            priority: Task priority (defaults to NO_STATUS)
            assignee_id: Optional admin to assign
            end_date: Optional target completion date

        Returns:
            Created Task object
        """
        task = Task(
            participant_id=participant_id,
            type=task_type,
            priority=priority,
            assignee_id=assignee_id,
            end_date=end_date,
            task_metadata=task_metadata or {},
        )

        db.add(task)
        db.flush()
        return task

    @staticmethod
    def get_tasks(
        db: Session,
        participant_id: Optional[UUID] = None,
        assignee_id: Optional[UUID] = None,
        task_type: Optional[TaskType] = None,
        status: Optional[TaskStatus] = None,
        priority: Optional[TaskPriority] = None,
    ) -> List[Task]:
        """
        Get tasks with optional filters.

        Args:
            db: Database session
            participant_id: Filter by participant
            assignee_id: Filter by assignee
            task_type: Filter by task type
            status: Filter by status
            priority: Filter by priority

        Returns:
            List of Task objects
        """
        query = db.query(Task)

        if participant_id:
            query = query.filter(Task.participant_id == participant_id)
        if assignee_id:
            query = query.filter(Task.assignee_id == assignee_id)
        if task_type:
            query = query.filter(Task.type == task_type)
        if status:
            query = query.filter(Task.status == status)
        if priority:
            query = query.filter(Task.priority == priority)

        # Order by priority (high first), then by creation date
        priority_order = {
            TaskPriority.HIGH: 1,
            TaskPriority.MEDIUM: 2,
            TaskPriority.LOW: 3,
            TaskPriority.NO_STATUS: 4,
        }

        tasks = query.all()
        tasks.sort(key=lambda t: (priority_order.get(t.priority, 5), t.created_at))

        return tasks

    @staticmethod
    def get_task_by_id(db: Session, task_id: UUID) -> Optional[Task]:
        """
        Get a single task by ID.

        Args:
            db: Database session
            task_id: Task ID

        Returns:
            Task object or None if not found
        """
        return db.query(Task).filter(Task.id == task_id).first()

    @staticmethod
    def assign_task(db: Session, task_id: UUID, assignee_id: UUID) -> Optional[Task]:
        """
        Assign a task to an admin.

        Args:
            db: Database session
            task_id: Task ID
            assignee_id: Admin user ID

        Returns:
            Updated Task object or None if not found
        """
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return None

        task.assignee_id = assignee_id
        task.updated_at = datetime.utcnow()
        db.flush()
        return task

    @staticmethod
    def update_task(
        db: Session,
        task_id: UUID,
        priority: Optional[TaskPriority] = None,
        assignee_id: Optional[UUID] = None,
        end_date: Optional[datetime] = None,
        status: Optional[TaskStatus] = None,
        task_metadata: Optional[Dict] = None,
    ) -> Optional[Task]:
        """
        Update task fields.

        Args:
            db: Database session
            task_id: Task ID
            priority: Updated priority
            assignee_id: Updated assignee
            end_date: Updated end date
            status: Updated status
            task_metadata: Updated metadata

        Returns:
            Updated Task object or None if not found
        """
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return None

        if priority is not None:
            task.priority = priority
        if assignee_id is not None:
            task.assignee_id = assignee_id
        if end_date is not None:
            task.end_date = end_date
        if status is not None:
            task.status = status
        if task_metadata is not None:
            task.task_metadata = task_metadata

        task.updated_at = datetime.utcnow()
        db.flush()
        return task

    @staticmethod
    def complete_task(db: Session, task_id: UUID) -> Optional[Task]:
        """
        Mark a task as completed.

        Args:
            db: Database session
            task_id: Task ID

        Returns:
            Updated Task object or None if not found
        """
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return None

        task.status = TaskStatus.COMPLETED
        task.updated_at = datetime.utcnow()
        db.flush()
        return task
