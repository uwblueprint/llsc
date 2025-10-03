from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID

from app.schemas.task import TaskCreateRequest, TaskResponse, TaskUpdateRequest


class ITaskService(ABC):
    """
    TaskService interface with task management methods
    """

    @abstractmethod
    async def create_task(self, task: TaskCreateRequest) -> TaskResponse:
        """
        Create a new task

        :param task: the task to be created
        :type task: TaskCreateRequest
        :return: the created task
        :rtype: TaskResponse
        :raises Exception: if task creation fails
        """
        pass

    @abstractmethod
    async def get_task_by_id(self, task_id: UUID) -> TaskResponse:
        """
        Get task associated with task_id

        :param task_id: task's id
        :type task_id: UUID
        :return: a TaskResponse with task's information
        :rtype: TaskResponse
        :raises Exception: if task retrieval fails
        """
        pass

    @abstractmethod
    async def get_all_tasks(
        self,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        task_type: Optional[str] = None,
        assignee_id: Optional[UUID] = None,
    ) -> List[TaskResponse]:
        """
        Get all tasks with optional filters

        :param status: filter by task status
        :type status: str, optional
        :param priority: filter by task priority
        :type priority: str, optional
        :param task_type: filter by task type
        :type task_type: str, optional
        :param assignee_id: filter by assignee
        :type assignee_id: UUID, optional
        :return: list of TaskResponse
        :rtype: List[TaskResponse]
        :raises Exception: if task retrieval fails
        """
        pass

    @abstractmethod
    async def update_task(self, task_id: UUID, task_update: TaskUpdateRequest) -> TaskResponse:
        """
        Update a task

        :param task_id: task's id
        :type task_id: UUID
        :param task_update: the task updates
        :type task_update: TaskUpdateRequest
        :return: the updated task
        :rtype: TaskResponse
        :raises Exception: if task update fails
        """
        pass

    @abstractmethod
    async def assign_task(self, task_id: UUID, assignee_id: UUID) -> TaskResponse:
        """
        Assign a task to an admin user

        :param task_id: task's id
        :type task_id: UUID
        :param assignee_id: admin user's id to assign
        :type assignee_id: UUID
        :return: the updated task
        :rtype: TaskResponse
        :raises Exception: if task assignment fails
        """
        pass

    @abstractmethod
    async def complete_task(self, task_id: UUID) -> TaskResponse:
        """
        Mark a task as completed

        :param task_id: task's id
        :type task_id: UUID
        :return: the completed task
        :rtype: TaskResponse
        :raises Exception: if task completion fails
        """
        pass

    @abstractmethod
    async def delete_task(self, task_id: UUID) -> None:
        """
        Delete a task by task_id

        :param task_id: task_id of task to be deleted
        :type task_id: UUID
        :raises Exception: if task deletion fails
        """
        pass
