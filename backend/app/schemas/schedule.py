from enum import Enum
from uuid import UUID
from datetime import datetime, timedelta
from typing import List
from schemas.time_block.py import TimeBlockBase, TimeBlockId, TimeBlockFull
from pydantic import BaseModel, ConfigDict



class ScheduleState(str, Enum):
    PENDING_PARTICIPANT = "PENDING_PARTICIPANT_RESPONSE"
    PENDING_VOLUNTEER = "PENDING_VOLUNTEER_RESPONSE"
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"

    @classmethod
    def to_schedule_state_id(cls, state: "ScheduleState") -> int:
        state_map = {
            cls.PENDING_PARTICIPANT: 1, 
            cls.PENDING_VOLUNTEER: 2, 
            cls.SCHEDULED: 3,
            cls.COMPLETED: 4}

        return state_map[state]

class ScheduleBase(BaseModel):
    scheduledTime: datetime
    duration: timedelta
    state: ScheduleState


class ScheduleInDB(ScheduleBase):
    id: UUID

    model_config = ConfigDict(from_attributes=True)

# Provides both Schedule data and full TimeBlock data 
class ScheduleData(ScheduleInDB):
    time_blocks: List[TimeBlockFull]

class ScheduleCreate(BaseModel):
    time_blocks: List[TimeBlockBase]

class ScheduleAdd(BaseModel):
    schedule_id: UUID
    time_blocks: List[TimeBlockBase]

class ScheduleRemove(BaseModel):
    schedule_id: UUID
    time_blocks: List[TimeBlockId]

