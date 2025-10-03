import logging
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.interfaces.task_service import ITaskService
from app.models import Task, TaskPriority, TaskStatus, TaskType, User
from app.schemas.task import TaskCreateRequest, TaskResponse, TaskUpdateRequest
from app.utilities.constants import LOGGER_NAME


class TaskService(ITaskService):
    def __init__(self, db: Session):
        self.db = db
        self.logger = logging.getLogger(LOGGER_NAME("task_service"))

    async def create_task(self, task: TaskCreateRequest) -> TaskResponse:
        """
        Create a new task in the database
        """
        try:
            # Validate participant exists if provided
            if task.participant_id:
                participant = self.db.query(User).filter(User.id == task.participant_id).first()
                if not participant:
                    raise HTTPException(status_code=404, detail="Participant not found")

            # Validate assignee is an admin if provided
            if task.assignee_id:
                assignee = self.db.query(User).filter(User.id == task.assignee_id, User.role_id == 3).first()
                if not assignee:
                    raise HTTPException(status_code=404, detail="Assignee must be an admin user")

            db_task = Task(
                participant_id=task.participant_id,
                type=TaskType(task.type),
                priority=TaskPriority(task.priority),
                assignee_id=task.assignee_id,
                start_date=task.start_date or datetime.utcnow(),
                end_date=task.end_date,
            )

            self.db.add(db_task)
            self.db.commit()
            self.db.refresh(db_task)

            self.logger.info(f"Created task {db_task.id} of type {task.type}")
            return TaskResponse.model_validate(db_task)

        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error creating task: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def get_task_by_id(self, task_id: UUID) -> TaskResponse:
        """
        Get a task by its ID
        """
        try:
            task = self.db.query(Task).filter(Task.id == task_id).first()
            if not task:
                raise HTTPException(status_code=404, detail="Task not found")
            return TaskResponse.model_validate(task)
        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Error retrieving task {task_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def get_all_tasks(
        self,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        task_type: Optional[str] = None,
        assignee_id: Optional[UUID] = None,
    ) -> List[TaskResponse]:
        """
        Get all tasks with optional filters
        """
        try:
            query = self.db.query(Task)

            # Apply filters if provided
            if status:
                try:
                    query = query.filter(Task.status == TaskStatus(status))
                except ValueError:
                    raise HTTPException(status_code=400, detail="Invalid status value")

            if priority:
                try:
                    query = query.filter(Task.priority == TaskPriority(priority))
                except ValueError:
                    raise HTTPException(status_code=400, detail="Invalid priority value")

            if task_type:
                try:
                    query = query.filter(Task.type == TaskType(task_type))
                except ValueError:
                    raise HTTPException(status_code=400, detail="Invalid task type value")

            if assignee_id:
                query = query.filter(Task.assignee_id == assignee_id)

            tasks = query.order_by(Task.created_at.desc()).all()
            return [TaskResponse.model_validate(task) for task in tasks]
        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Error retrieving tasks: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def update_task(self, task_id: UUID, task_update: TaskUpdateRequest) -> TaskResponse:
        """
        Update a task
        """
        try:
            db_task = self.db.query(Task).filter(Task.id == task_id).first()
            if not db_task:
                raise HTTPException(status_code=404, detail="Task not found")

            # Update provided fields only
            update_data = task_update.model_dump(exclude_unset=True)

            # Validate participant if being updated
            if "participant_id" in update_data and update_data["participant_id"]:
                participant = self.db.query(User).filter(User.id == update_data["participant_id"]).first()
                if not participant:
                    raise HTTPException(status_code=404, detail="Participant not found")

            # Validate assignee is admin if being updated
            if "assignee_id" in update_data and update_data["assignee_id"]:
                assignee = self.db.query(User).filter(User.id == update_data["assignee_id"], User.role_id == 3).first()
                if not assignee:
                    raise HTTPException(status_code=404, detail="Assignee must be an admin user")

            # Convert enum strings to enum types if needed
            if "type" in update_data:
                update_data["type"] = TaskType(update_data["type"])
            if "priority" in update_data:
                update_data["priority"] = TaskPriority(update_data["priority"])
            if "status" in update_data:
                update_data["status"] = TaskStatus(update_data["status"])

            for field, value in update_data.items():
                setattr(db_task, field, value)

            db_task.updated_at = datetime.utcnow()

            self.db.commit()
            self.db.refresh(db_task)

            self.logger.info(f"Updated task {task_id}")
            return TaskResponse.model_validate(db_task)

        except HTTPException:
            raise
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid enum value: {str(e)}")
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error updating task {task_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def assign_task(self, task_id: UUID, assignee_id: UUID) -> TaskResponse:
        """
        Assign a task to an admin user
        """
        try:
            db_task = self.db.query(Task).filter(Task.id == task_id).first()
            if not db_task:
                raise HTTPException(status_code=404, detail="Task not found")

            # Validate assignee is an admin
            assignee = self.db.query(User).filter(User.id == assignee_id, User.role_id == 3).first()
            if not assignee:
                raise HTTPException(status_code=404, detail="Assignee must be an admin user")

            db_task.assignee_id = assignee_id
            db_task.updated_at = datetime.utcnow()

            self.db.commit()
            self.db.refresh(db_task)

            self.logger.info(f"Assigned task {task_id} to admin {assignee_id}")
            return TaskResponse.model_validate(db_task)

        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error assigning task {task_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def complete_task(self, task_id: UUID) -> TaskResponse:
        """
        Mark a task as completed
        """
        try:
            db_task = self.db.query(Task).filter(Task.id == task_id).first()
            if not db_task:
                raise HTTPException(status_code=404, detail="Task not found")

            db_task.status = TaskStatus.COMPLETED
            db_task.end_date = datetime.utcnow()
            db_task.updated_at = datetime.utcnow()

            self.db.commit()
            self.db.refresh(db_task)

            self.logger.info(f"Completed task {task_id}")
            return TaskResponse.model_validate(db_task)

        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error completing task {task_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def delete_task(self, task_id: UUID) -> None:
        """
        Delete a task
        """
        try:
            db_task = self.db.query(Task).filter(Task.id == task_id).first()
            if not db_task:
                raise HTTPException(status_code=404, detail="Task not found")

            self.db.delete(db_task)
            self.db.commit()

            self.logger.info(f"Deleted task {task_id}")

        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error deleting task {task_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
