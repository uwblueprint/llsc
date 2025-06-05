from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

class TimeRange(BaseModel):
    start_time: datetime
    end_time: datetime

class TimeBlockBase(BaseModel):
    start_time: datetime

class TimeBlockId(BaseModel):
    id: int

class TimeBlockEntity(BaseModel):
    id: int
    start_time: datetime

