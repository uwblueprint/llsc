from datetime import date
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TreatmentResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class ExperienceResponse(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class UserDataResponse(BaseModel):
    id: UUID
    user_id: UUID

    # Personal Information
    first_name: Optional[str]
    last_name: Optional[str]
    date_of_birth: Optional[date]
    email: Optional[str]
    phone: Optional[str]
    city: Optional[str]
    province: Optional[str]
    postal_code: Optional[str]

    # Demographics
    gender_identity: Optional[str]
    pronouns: Optional[List[str]]
    ethnic_group: Optional[List[str]]
    marital_status: Optional[str]
    has_kids: Optional[str]
    timezone: Optional[str]

    # Cancer Experience
    diagnosis: Optional[str]
    date_of_diagnosis: Optional[date]

    # Custom entries
    other_ethnic_group: Optional[str]
    gender_identity_custom: Optional[str]
    additional_info: Optional[str]

    # Flow control
    has_blood_cancer: Optional[str]
    caring_for_someone: Optional[str]

    # Loved One Info
    loved_one_gender_identity: Optional[str]
    loved_one_age: Optional[str]
    loved_one_diagnosis: Optional[str]
    loved_one_date_of_diagnosis: Optional[date]

    # Relations
    treatments: List[TreatmentResponse] = []
    experiences: List[ExperienceResponse] = []
    loved_one_treatments: List[TreatmentResponse] = []
    loved_one_experiences: List[ExperienceResponse] = []

    model_config = ConfigDict(from_attributes=True)


class UserDataUpdateRequest(BaseModel):
    """
    Request schema for user_data updates, all fields optional.
    Supports partial updates for user's own data and loved one's data.
    """

    # Personal Information
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    postal_code: Optional[str] = None

    # Demographics
    gender_identity: Optional[str] = None
    pronouns: Optional[List[str]] = Field(None, description="List of pronoun strings")
    ethnic_group: Optional[List[str]] = Field(None, description="List of ethnic group strings")
    marital_status: Optional[str] = None
    has_kids: Optional[str] = None
    timezone: Optional[str] = None

    # User's Cancer Experience
    diagnosis: Optional[str] = None
    date_of_diagnosis: Optional[date] = None
    treatments: Optional[List[str]] = Field(None, description="List of treatment names")
    experiences: Optional[List[str]] = Field(None, description="List of experience names")
    additional_info: Optional[str] = None

    # Loved One Demographics
    loved_one_gender_identity: Optional[str] = None
    loved_one_age: Optional[str] = None

    # Loved One's Cancer Experience
    loved_one_diagnosis: Optional[str] = None
    loved_one_date_of_diagnosis: Optional[date] = None
    loved_one_treatments: Optional[List[str]] = Field(None, description="List of treatment names")
    loved_one_experiences: Optional[List[str]] = Field(None, description="List of experience names")

    model_config = ConfigDict(from_attributes=True)
