from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

class ScheduleBase(BaseModel):
    state: Enum # ??
    # start time etc.

class ScheduleInDB(BaseModel):
    id: UUID

    model_config = ConfigDict(from_attributes=True)
    