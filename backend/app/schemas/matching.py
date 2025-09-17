"""
Pydantic schemas for matching-related data validation and serialization.
"""

from typing import List

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
