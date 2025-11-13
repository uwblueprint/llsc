from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.time_block import TimeBlockEntity, TimeRange


class MatchResponse(BaseModel):
    id: int
    participant_id: UUID
    volunteer_id: UUID
    match_status: str
    chosen_time_block_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class MatchCreateRequest(BaseModel):
    participant_id: UUID
    volunteer_ids: List[UUID] = Field(..., min_length=1)
    match_status: Optional[str] = None


class MatchCreateResponse(BaseModel):
    matches: List[MatchResponse]


class MatchUpdateRequest(BaseModel):
    volunteer_id: Optional[UUID] = None
    match_status: Optional[str] = None
    chosen_time_block_id: Optional[int] = None
    clear_chosen_time: bool = False


class MatchScheduleRequest(BaseModel):
    time_block_id: int


class MatchRequestNewTimesRequest(BaseModel):
    suggested_new_times: List[TimeRange] = Field(..., min_length=1)


class MatchVolunteerSummary(BaseModel):
    id: UUID
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: str
    pronouns: Optional[List[str]] = None
    diagnosis: Optional[str] = None
    age: Optional[int] = None
    timezone: Optional[str] = None
    treatments: List[str] = Field(default_factory=list)
    experiences: List[str] = Field(default_factory=list)
    overview: Optional[str] = None  # Volunteer experience/overview from volunteer_data

    model_config = ConfigDict(from_attributes=True)


class MatchParticipantSummary(BaseModel):
    id: UUID
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: str
    pronouns: Optional[List[str]] = None
    diagnosis: Optional[str] = None
    age: Optional[int] = None
    treatments: List[str] = Field(default_factory=list)
    experiences: List[str] = Field(default_factory=list)
    timezone: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class MatchDetailResponse(BaseModel):
    id: int
    participant_id: UUID
    volunteer: MatchVolunteerSummary
    match_status: str
    chosen_time_block: Optional[TimeBlockEntity] = None
    suggested_time_blocks: List[TimeBlockEntity]
    created_at: datetime
    updated_at: Optional[datetime] = None


class MatchListResponse(BaseModel):
    matches: List[MatchDetailResponse]
    has_pending_request: bool


class MatchDetailForVolunteerResponse(BaseModel):
    id: int
    participant_id: UUID
    volunteer_id: UUID
    participant: MatchParticipantSummary
    match_status: str
    created_at: datetime
    updated_at: Optional[datetime] = None


class MatchListForVolunteerResponse(BaseModel):
    matches: List[MatchDetailForVolunteerResponse]


class MatchRequestNewVolunteersResponse(BaseModel):
    deleted_matches: int


class MatchRequestNewVolunteersRequest(BaseModel):
    participant_id: Optional[UUID] = None
    message: Optional[str] = None
