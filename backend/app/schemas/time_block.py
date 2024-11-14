from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, datetime, Field, field_validator

class TimeBlockBase(BaseModel):
    schedule_id: int
    start_time = datetime
    end_time = datetime
    