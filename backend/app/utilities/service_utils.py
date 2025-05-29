import logging

from fastapi import Depends
from sqlalchemy.orm import Session

from ..services.implementations.auth_service import AuthService
from ..services.implementations.user_data_service import UserDataService
from ..services.implementations.user_service import UserService
from .db_utils import get_db


def get_user_service(db: Session = Depends(get_db)):
    return UserService(db)


def get_user_data_service(db: Session = Depends(get_db)):
    return UserDataService(db)


def get_auth_service(db: Session = Depends(get_db)):
    logger = logging.getLogger(__name__)
    return AuthService(logger=logger, user_service=UserService(db))
