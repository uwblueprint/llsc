from datetime import datetime, timedelta
from enum import Enum
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.time_block import TimeBlockEntity, TimeRange, TimeBlockId


class CreateAvailabilityRequest(BaseModel):
    user_id: UUID
    available_times: List[TimeRange]


class CreateAvailabilityResponse(BaseModel):
    user_id: UUID


class GetAvailabilityRequest(BaseModel):
    user_id: UUID

class AvailabilityEntity(BaseModel):
    user_id: UUID
    available_times: List[TimeBlockEntity]

