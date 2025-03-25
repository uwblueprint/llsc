from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class TimeRange(BaseModel):
    start_time: datetime
    end_time: datetime

class TimeBlockBase(BaseModel):
    start_time: datetime


class TimeBlockId(BaseModel):
    id: UUID


class TimeBlockEntity(BaseModel):
    id: UUID
    start_time: datetime

