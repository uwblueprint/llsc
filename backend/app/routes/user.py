from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.user import UserCreate, UserInDB
from app.services.implementations.user_service import UserService
from app.utilities.db_utils import get_db

router = APIRouter(
    prefix="/users",
    tags=["users"],
)

# to do:
# send email verification via auth_service
# allow signup methods other than email (like sign up w Google)??


@router.post("/", response_model=UserInDB)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    user_service = UserService(db)
    try:
        created_user = await user_service.create_user(user)
        return created_user
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
