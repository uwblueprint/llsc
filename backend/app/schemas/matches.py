from uuid import UUID
from typing import Optional
from pydantic import BaseModel, Field


"""
Pydantic schemas for match-related data validation and serialization.
Handles match creation, updates, and responses for the API.
"""


class MatchBase(BaseModel):
    """
    Base schema for matches, shared across create and response schemas.
    """

    user1_id: UUID = Field(..., description="UUID of the first user in the match")
    user2_id: UUID = Field(..., description="UUID of the second user in the match")

class MatchCreateRequest(BaseModel):
    """
    Request schema for creating a match.
    Requires two user IDs.
    """

    user1_id: UUID = Field(..., description="UUID of the first user in the match")
    user2_id: UUID = Field(..., description="UUID of the second user in the match")
    metadata: Optional[dict] = Field(default=None, description="Optional metadata for the match") # expand this to smth else if there needs to be in the future


class MatchUpdateRequest(BaseModel):
    """
    Request schema for updating an existing match.
    """

    metadata: Optional[dict] = Field(default=None, description="Optional metadata for the match") # expand this to smth else if there needs to be in the future


class MatchResponse(MatchBase):
    """
    Response schema for match creation and retrieval.
    """

    id: UUID = Field(..., description="UUID of the match")
    created_at: str = Field(..., description="Timestamp when the match was created")
    updated_at: str = Field(..., description="Timestamp when the match was last updated")
    metadata: Optional[dict] = Field(default=None, description="Additional metadata about the match")

    model_config = ConfigDict(from_attributes=True)  # Enables mapping from ORM model to Pydantic model
