"""
Pydantic schemas for user-related data validation and serialization.
Handles user CRUD and response models for the API.
"""

from enum import Enum
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from .time_block import TimeBlockEntity
from .user_data import UserDataResponse
from .volunteer_data import VolunteerDataResponse

# TODO:
# confirm complexity rules for fields (such as password)


class SignUpMethod(str, Enum):
    """Authentication methods supported for user signup"""

    PASSWORD = "PASSWORD"
    GOOGLE = "GOOGLE"


class UserRole(str, Enum):
    """
    Enum for possible user roles.
    """

    PARTICIPANT = "participant"
    VOLUNTEER = "volunteer"
    ADMIN = "admin"

    @classmethod
    def to_role_id(cls, role: "UserRole") -> int:
        role_map = {cls.PARTICIPANT: 1, cls.VOLUNTEER: 2, cls.ADMIN: 3}
        return role_map[role]


class FormStatus(str, Enum):
    INTAKE_TODO = "intake-todo"
    INTAKE_SUBMITTED = "intake-submitted"
    RANKING_TODO = "ranking-todo"
    RANKING_SUBMITTED = "ranking-submitted"
    SECONDARY_APPLICATION_TODO = "secondary-application-todo"
    SECONDARY_APPLICATION_SUBMITTED = "secondary-application-submitted"
    COMPLETED = "completed"
    REJECTED = "rejected"


class UserBase(BaseModel):
    """
    Base schema for user model with common attributes shared across schemas.
    """

    first_name: Optional[str] = Field(None, min_length=0, max_length=50)
    last_name: Optional[str] = Field(None, min_length=0, max_length=50)
    email: EmailStr
    role: UserRole

    model_config = ConfigDict(from_attributes=True)


class UserCreateRequest(UserBase):
    """
    Request schema for user creation with conditional password validation
    """

    password: Optional[str] = Field(None)
    auth_id: Optional[str] = Field(None)
    signup_method: SignUpMethod = Field(default=SignUpMethod.PASSWORD)

    @field_validator("password")
    def validate_password(cls, password: Optional[str], info):
        signup_method = info.data.get("signup_method")

        if signup_method == SignUpMethod.PASSWORD and not password:
            raise ValueError("Password is required for password signup")

        if password:
            errors = []
            if len(password) < 8:
                errors.append("Password must be at least 8 characters long")
            if not any(char.isupper() for char in password):
                errors.append("Password must contain at least one uppercase letter")
            if not any(char.islower() for char in password):
                errors.append("Password must contain at least one lowercase letter")
            if not any(char in "!@#$%^&*" for char in password):
                errors.append("Password must contain at least one special character (!, @, #, $, %, ^, &, or *)")

            if errors:
                raise ValueError(errors)

        return password


class UserUpdateRequest(BaseModel):
    """
    Request schema for user updates, all fields optional
    """

    first_name: Optional[str] = Field(None, min_length=0, max_length=50)
    last_name: Optional[str] = Field(None, min_length=0, max_length=50)
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    approved: Optional[bool] = None
    form_status: Optional[FormStatus] = None


class UserCreateResponse(BaseModel):
    """
    Response schema for user creation, maps directly from ORM User object.
    """

    id: UUID
    first_name: Optional[str]
    last_name: Optional[str]
    email: EmailStr
    role_id: int
    auth_id: str
    approved: bool
    form_status: FormStatus

    # from_attributes enables automatic mapping from SQLAlchemy model to Pydantic model
    model_config = ConfigDict(from_attributes=True)


class UserResponse(BaseModel):
    """
    Response schema for user data including role information
    """

    id: UUID
    first_name: Optional[str]
    last_name: Optional[str]
    email: EmailStr
    role_id: int
    auth_id: str
    approved: bool
    role: "RoleResponse"
    form_status: FormStatus
    user_data: Optional[UserDataResponse] = None
    volunteer_data: Optional[VolunteerDataResponse] = None
    availability: List[TimeBlockEntity] = []

    model_config = ConfigDict(from_attributes=True)


class RoleResponse(BaseModel):
    """
    Response schema for role data
    """

    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class UserListResponse(BaseModel):
    """
    Response schema for listing users
    """

    users: List[UserResponse]
    total: int
