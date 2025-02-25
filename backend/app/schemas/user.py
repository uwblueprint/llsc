"""
Pydantic schemas for user-related data validation and serialization.
Handles user CRUD and response models for the API.
"""

from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

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


class UserBase(BaseModel):
    """
    Base schema for user model with common attributes shared across schemas.
    """

    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    role: UserRole


class UserCreateRequest(UserBase):
    """
    Request schema for user creation with conditional password validation
    """

    password: Optional[str] = Field(None, min_length=8)
    auth_id: Optional[str] = Field(None)
    signup_method: SignUpMethod = Field(default=SignUpMethod.PASSWORD)

    @field_validator("password")
    def validate_password(cls, password: Optional[str], info):
        signup_method = info.data.get("signup_method")

        if signup_method == SignUpMethod.PASSWORD and not password:
            raise ValueError("Password is required for password signup")

        if password:
            if not any(char.isdigit() for char in password):
                raise ValueError("Password must contain at least one digit")
            if not any(char.isupper() for char in password):
                raise ValueError("Password must contain at least one uppercase letter")
            if not any(char.islower() for char in password):
                raise ValueError("Password must contain at least one lowercase letter")

        return password


class UserCreateResponse(BaseModel):
    """
    Response schema for user creation, maps directly from ORM User object.
    """

    id: UUID
    first_name: str
    last_name: str
    email: EmailStr
    role_id: int
    auth_id: str

    # from_attributes enables automatic mapping from SQLAlchemy model to Pydantic model
    model_config = ConfigDict(from_attributes=True)