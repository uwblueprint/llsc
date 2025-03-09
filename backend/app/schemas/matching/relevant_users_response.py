from pydantic import BaseModel
from app.schemas.user import UserBase
from typing import List

class RelevantUsersResponse(BaseModel):
    users: List[UserBase]
    
    class Config:
        orm_mode = True