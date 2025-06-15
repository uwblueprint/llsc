from typing import List
from uuid import UUID

from pydantic import BaseModel

from app.schemas.time_block import TimeBlockEntity, TimeRange


class CreateAvailabilityRequest(BaseModel):
    user_id: UUID
    available_times: List[TimeRange]


class CreateAvailabilityResponse(BaseModel):
    user_id: UUID
    added: int


class GetAvailabilityRequest(BaseModel):
    user_id: UUID

class AvailabilityEntity(BaseModel):
    user_id: UUID
    available_times: List[TimeBlockEntity]


class DeleteAvailabilityRequest(BaseModel):
    user_id: UUID
    delete: list[TimeRange] = []

class DeleteAvailabilityResponse(BaseModel):
    user_id: UUID
    deleted: int

    # return the user’s availability after the update
    availability: List[TimeBlockEntity]
