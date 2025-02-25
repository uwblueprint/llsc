
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID

class TimeBlockBase(BaseModel):
    start_time: datetime
    end_time: datetime

class TimeBlockId(BaseModel):
    id: int

class TimeBlockFull(TimeBlockBase, TimeBlockId):
    '''
    Combines TimeBlockBase and TimeBlockId.
    Represents a full time block with an ID and time range.
    '''
    model_config = ConfigDict(from_attributes=True)

class TimeBlockInDB(BaseModel):
    id: int
    schedule_id: int
    start_time: datetime
    end_time: datetime
