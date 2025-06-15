from datetime import datetime

from pydantic import BaseModel, ConfigDict, model_validator


class TimeRange(BaseModel):
    start_time: datetime
    end_time: datetime

    # validate end_time
    @model_validator(mode="after")
    def check_times(self):
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time")
        if self.start_time.minute != 0 or self.end_time.minute != 0:
            raise ValueError("Times must be on the hour")
        return self

class TimeBlockBase(BaseModel):
    start_time: datetime

class TimeBlockId(BaseModel):
    id: int

class TimeBlockEntity(BaseModel):
    id: int
    start_time: datetime
    model_config = ConfigDict(from_attributes=True)
