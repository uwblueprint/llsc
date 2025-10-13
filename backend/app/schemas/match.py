from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.time_block import TimeBlockEntity


class SubmitMatchRequest(BaseModel):
    match_id: int
    time_block_id: int


class SubmitMatchResponse(BaseModel):
    match_id: int
    time_block: TimeBlockEntity


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


class MatchVolunteerSummary(BaseModel):
    id: UUID
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: str

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
