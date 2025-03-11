from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

class MatchStatus(str, Enum):
    PENDING_ADMIN_APPROVAL = "pending_admin_approval"
    APPROVED = "approved"
    REJECTED = "rejected"

class ScheduleStatus(str, Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    DECLINED = "declined"
    PENDING_PARTICIPANT_RESPONSE = "pending_participant_response"
    PENDING_VOLUNTEER_RESPONSE = "pending_volunteer_response"
    CANCELLED = "cancelled"

class MatchBase(BaseModel):
    participant_id: UUID
    volunteer_id: UUID

class MatchResponse(MatchBase):
    id: UUID
    match_status: Optional[MatchStatus] = None
    schedule_status: Optional[ScheduleStatus] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Allows converting from SQLAlchemy models