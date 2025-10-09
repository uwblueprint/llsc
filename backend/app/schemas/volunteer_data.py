"""
Pydantic schemas for volunteer data validation and serialization.
Handles volunteer data CRUD and response models for the API.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class VolunteerDataBase(BaseModel):
    """
    Base schema for volunteer data model with common attributes.
    """

    experience: Optional[str] = Field(None, description="Volunteer experience description")
    references_json: Optional[str] = Field(None, description="JSON string containing references")
    additional_comments: Optional[str] = Field(None, description="Additional comments about volunteering")


class VolunteerDataCreateRequest(VolunteerDataBase):
    """
    Request schema for creating volunteer data
    """

    user_id: Optional[UUID] = Field(
        None,
        description="User ID this volunteer data belongs to (optional for public submissions)"
    )


class VolunteerDataPublicSubmission(VolunteerDataBase):
    """
    Request schema for public volunteer data submissions (no user_id required)
    """

    pass


class VolunteerDataUpdateRequest(BaseModel):
    """
    Request schema for updating volunteer data, all fields optional
    """

    experience: Optional[str] = Field(None, description="Volunteer experience description")
    references_json: Optional[str] = Field(None, description="JSON string containing references")
    additional_comments: Optional[str] = Field(None, description="Additional comments about volunteering")


class VolunteerDataResponse(BaseModel):
    """
    Response schema for volunteer data
    """

    id: UUID
    user_id: Optional[UUID]
    experience: Optional[str]
    references_json: Optional[str]
    additional_comments: Optional[str]
    submitted_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VolunteerDataListResponse(BaseModel):
    """
    Response schema for listing volunteer data
    """

    volunteer_data: List[VolunteerDataResponse]
    total: int
