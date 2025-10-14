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
        if not self._is_half_hour(self.start_time) or not self._is_half_hour(self.end_time):
            raise ValueError("Times must start on the hour or half hour")
        return self

    @staticmethod
    def _is_half_hour(value: datetime) -> bool:
        return value.minute in {0, 30} and value.second == 0 and value.microsecond == 0


class TimeBlockBase(BaseModel):
    start_time: datetime


class TimeBlockId(BaseModel):
    id: int


class TimeBlockEntity(BaseModel):
    id: int
    start_time: datetime
    model_config = ConfigDict(from_attributes=True)
