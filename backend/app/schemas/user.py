from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserRole(str, Enum):
    PARTICIPANT = "participant"
    VOLUNTEER = "volunteer"
    ADMIN = "admin"

    @classmethod
    def to_role_id(cls, role: "UserRole") -> int:
        role_map = {cls.PARTICIPANT: 1, cls.VOLUNTEER: 2, cls.ADMIN: 3}
        return role_map[role]


class UserBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    role: UserRole


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

    @field_validator("password")
    def password_complexity(cls, v):
        if not any(char.isdigit() for char in v):
            raise ValueError("Password must contain at least one digit")
        if not any(char.isupper() for char in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(char.islower() for char in v):
            raise ValueError("Password must contain at least one lowercase letter")
        return v


class UserInDB(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    email: EmailStr
    role_id: int
    auth_id: str

    model_config = ConfigDict(from_attributes=True)


class User(UserBase):
    id: UUID

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    first_name: str | None = Field(None, min_length=1, max_length=50)
    last_name: str | None = Field(None, min_length=1, max_length=50)
    email: EmailStr | None = None
    role: UserRole | None = None

    model_config = ConfigDict(from_attributes=True)
