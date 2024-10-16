from fastapi import APIRouter, Depends, HTTPException
from app.schemas.user import UserCreate, User
from app.services.implementations.user_service import UserService

router = APIRouter(
    prefix="/users",
    tags=["users"],
)

# to do: send email verification via auth_service

@router.post("/", response_model=User)
async def create_user(user: UserCreate, user_service: UserService = Depends()):
    try:
        created_user = await user_service.create_user(user)
        return created_user
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))