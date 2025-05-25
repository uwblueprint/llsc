from datetime import datetime, timedelta
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator

class TimeRange(BaseModel):
    start_time: datetime
    end_time: datetime

    # validate end_time
    @field_validator('end_time')
    @classmethod
    def validate_range(cls, end_time: datetime, values):
        """
        Validate that start_time <= end_time and both are formatted to the hour
        """
        start_time: datetime | None = values.get("start_time")

        if start_time is None:
            raise ValueError("start_time is required")

        # chronological order
        if end_time <= start_time:
            raise ValueError("end_time must be after start_time")

        # alignment to :00
        for t in (start_time, end_time):
            if any(t.minute != 0 or t.second != 0 or t.microsecond != 0):
                raise ValueError("start_time and end_time must be on the hour (mm=00)")

        return end_time

class TimeBlockBase(BaseModel):
    start_time: datetime

class TimeBlockId(BaseModel):
    id: int

class TimeBlockEntity(BaseModel):
    id: int
    start_time: datetime
    model_config = ConfigDict(from_attributes=True)
