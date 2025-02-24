from enum import Enum
from uuid import UUID
from datetime import datetime, timedelta
from typing import List, Optional
from app.schemas.time_block import TimeBlockBase, TimeBlockId, TimeBlockFull
from pydantic import BaseModel, ConfigDict



class ScheduleStatus(str, Enum):
    PENDING_VOLUNTEER = "PENDING_VOLUNTEER_RESPONSE"
    PENDING_PARTICIPANT = "PENDING_PARTICIPANT_RESPONSE"
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"

    @classmethod
    def to_schedule_status_id(cls, state: "ScheduleStatus") -> int:
        status_map = {
            cls.PENDING_VOLUNTEER: 1,
            cls.PENDING_PARTICIPANT: 2,
            cls.SCHEDULED: 3,
            cls.COMPLETED: 4}

        return status_map[state]

class ScheduleBase(BaseModel):
    scheduled_time: Optional[datetime]
    duration: Optional[timedelta]
    status_id: int


class ScheduleEntity(ScheduleBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# Provides both Schedule data and full TimeBlock data 
class ScheduleGetResponse(ScheduleEntity):
    time_blocks: List[TimeBlockFull]

# List of Start and End times to Create a Schedule with
class ScheduleCreateRequest(BaseModel):
    time_blocks: List[TimeBlockBase]

class ScheduleUpdateRequest(BaseModel):
    schedule_id: UUID
    time_blocks: List[TimeBlockBase]

class ScheduleDeleteRequest(BaseModel):
    schedule_id: UUID
    time_blocks: List[TimeBlockId]

