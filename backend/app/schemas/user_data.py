from datetime import date
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


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

