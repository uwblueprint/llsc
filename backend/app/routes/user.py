from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth import has_roles
from app.schemas.user import UserCreateRequest, UserCreateResponse, UserRole
from app.services.implementations.user_service import UserService
from app.utilities.service_utils import get_user_service

router = APIRouter(
    prefix="/users",
    tags=["users"],
)

# TODO:
# send email verification via auth_service
# allow signup methods other than email (like sign up w Google)??

#admin only manually create user, not sure if this is needed
@router.post("/", response_model=UserCreateResponse)
async def create_user(
    user: UserCreateRequest,
    user_service: UserService = Depends(get_user_service),
    authorized: bool = has_roles([UserRole.ADMIN])
):
    try:
        return await user_service.create_user(user)
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
