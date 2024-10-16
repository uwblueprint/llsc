from pydantic import BaseModel, EmailStr, Field, validator
from enum import Enum
from uuid import UUID

class UserRole(str, Enum):
    PARTICIPANT = "participant"
    VOLUNTEER = "volunteer"
    ADMIN = "admin"

class RoleBase(BaseModel):
    id: int
    name: UserRole

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    role: RoleBase

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

    @validator('password')
    def password_complexity(cls, v):
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(char.islower() for char in v):
            raise ValueError('Password must contain at least one lowercase letter')
        return v

class UserInDB(UserBase):
    id: UUID
    auth_id: str

    class Config:
        from_attributes = True

class User(UserBase):
    id: str

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    first_name: str | None = Field(None, min_length=1, max_length=50)
    last_name: str | None = Field(None, min_length=1, max_length=50)
    email: EmailStr | None = None
    role: RoleBase | None = None

    class Config:
        from_attributes = True