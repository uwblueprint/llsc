"""
Pydantic schemas for user data validation and serialization.
Handles user data CRUD and response models for the API.
"""

from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserDataBase(BaseModel):
    """
    Base schema for user data with common attributes shared across schemas.
    """

    date_of_birth: Optional[date] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    postal_code: Optional[str] = Field(None, max_length=10)
    province: Optional[str] = Field(None, max_length=50)
    city: Optional[str] = Field(None, max_length=100)
    language: Optional[str] = Field(None, max_length=50)
    criminal_record_status: Optional[bool] = None
    blood_cancer_status: Optional[bool] = None
    caregiver_status: Optional[bool] = None
    caregiver_type: Optional[str] = Field(None, max_length=100)
    diagnostic: Optional[str] = Field(None, max_length=200)
    date_of_diagnosis: Optional[date] = None
    gender_identity: Optional[str] = Field(None, max_length=50)
    pronouns: Optional[str] = Field(None, max_length=50)
    ethnicity: Optional[str] = Field(None, max_length=100)
    marital_status: Optional[str] = Field(None, max_length=50)
    children_status: Optional[bool] = None
    treatment: Optional[str] = None
    experience: Optional[str] = None
    # NOTE: preferences can either be a comma-separated string or an array of strings coming from the
    # client. We keep the underlying DB column as Text but allow the schema to accept both shapes so
    # that the service layer can serialise the list form when necessary.
    preferences: Optional[str | list[str]] = None  # type: ignore[valid-type]


class UserDataCreateRequest(UserDataBase):
    """
    Request schema for user data creation.
    """

    user_id: UUID


class UserDataUpdateRequest(UserDataBase):
    """
    Request schema for user data update.
    All fields are optional for partial updates.
    """

    pass


class UserDataResponse(UserDataBase):
    """
    Response schema for user data, maps directly from ORM UserData object.
    """

    id: UUID
    user_id: UUID

    # from_attributes enables automatic mapping from SQLAlchemy model to Pydantic model
    model_config = ConfigDict(from_attributes=True)
