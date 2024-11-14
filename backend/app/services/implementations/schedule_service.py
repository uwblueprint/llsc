import logging

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Schedule, TimeBlock
# from app.schemas.schedule import UserCreate, UserInDB, UserRole
# from app.schemas.time_block import UserCreate, UserInDB, UserRole
from app.services.interfaces.schedule_service import IScheduleService


class ScheduleService(IScheduleService):
    def __init__(self, db: Session):
        self.db = db
        self.logger = logging.getLogger(__name__)

    async def create_schedule(self, schedule: ScheduleCreate) -> ScheduleInDB:
    
