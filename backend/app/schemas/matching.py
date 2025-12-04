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
    treatments: List[str] = []
    experiences: List[str] = []
    match_score: float  # 0-100 scale


class AdminMatchesResponse(BaseModel):
    """
    Response schema for admin matching endpoint containing a list of match candidates with full details.
    """

    matches: List[AdminMatchCandidate]
