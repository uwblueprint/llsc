from typing import List
from uuid import UUID
from datetime import time

from pydantic import BaseModel

from app.schemas.time_block import TimeBlockEntity


class AvailabilityTemplateSlot(BaseModel):
    """Represents a single availability template slot (day of week + time range)"""
    day_of_week: int  # 0=Monday, 1=Tuesday, ..., 6=Sunday
    start_time: time  # e.g., 14:00:00
    end_time: time    # e.g., 16:00:00


class CreateAvailabilityRequest(BaseModel):
    user_id: UUID
    templates: List[AvailabilityTemplateSlot]


class CreateAvailabilityResponse(BaseModel):
    user_id: UUID
    added: int


class GetAvailabilityRequest(BaseModel):
    user_id: UUID


class AvailabilityEntity(BaseModel):
    user_id: UUID
    templates: List[AvailabilityTemplateSlot]


class DeleteAvailabilityRequest(BaseModel):
    user_id: UUID
    templates: List[AvailabilityTemplateSlot] = []


class DeleteAvailabilityResponse(BaseModel):
    user_id: UUID
    deleted: int
    templates: List[AvailabilityTemplateSlot]  # remaining templates after deletion
