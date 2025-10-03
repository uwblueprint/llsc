import logging

from fastapi import Depends
from sqlalchemy.orm import Session

from ..services.implementations.auth_service import AuthService
from ..services.implementations.task_service import TaskService
from ..services.implementations.user_service import UserService
from .db_utils import get_db


def get_user_service(db: Session = Depends(get_db)):
    return UserService(db)


def get_auth_service(user_service: UserService = Depends(get_user_service)):
    logger = logging.getLogger(__name__)
    return AuthService(logger=logger, user_service=user_service)


def get_task_service(db: Session = Depends(get_db)):
    return TaskService(db)
