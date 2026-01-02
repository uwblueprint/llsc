"""
Pydantic schemas for matching-related data validation and serialization.
"""

from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel

from .user import UserBase


class MatchedUser(BaseModel):
    """
    Schema for a matched user with their compatibility score.
    """

    user: UserBase
    score: float


class RelevantUsersResponse(BaseModel):
    """
    Response schema for matching endpoint containing a list of relevant users with scores.
    """

    matches: List[MatchedUser]


class AdminMatchCandidate(BaseModel):
    """
    Schema for an admin match candidate with full volunteer details and match score.
    Used for displaying potential matches in the admin interface.
    """

    volunteer_id: UUID
    first_name: Optional[str]
    last_name: Optional[str]
    email: str
    timezone: Optional[str]
    age: Optional[int]
    diagnosis: Optional[str]
    date_of_diagnosis: Optional[str] = None  # ISO format date string
    treatments: List[str] = []
    experiences: List[str] = []
    match_score: float  # 0-100 scale
    match_count: int = 0  # Number of active matches for this volunteer
    # Additional fields for dynamic columns based on preferences
    marital_status: Optional[str] = None
    gender_identity: Optional[str] = None
    ethnic_group: Optional[List[str]] = None
    has_kids: Optional[str] = None
    loved_one_age: Optional[str] = None
    loved_one_diagnosis: Optional[str] = None
    loved_one_date_of_diagnosis: Optional[str] = None  # ISO format date string
    loved_one_treatments: List[str] = []
    loved_one_experiences: List[str] = []


class AdminMatchesResponse(BaseModel):
    """
    Response schema for admin matching endpoint containing a list of match candidates with full details.
    """

    matches: List[AdminMatchCandidate]
