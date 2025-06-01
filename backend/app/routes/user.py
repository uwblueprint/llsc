from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth import has_roles
from app.schemas.user import (
    UserCreateRequest,
    UserCreateResponse,
    UserListResponse,
    UserResponse,
    UserRole,
    UserUpdateRequest,
)
from app.services.implementations.user_service import UserService
from app.utilities.service_utils import get_user_service

router = APIRouter(
    prefix="/users",
    tags=["users"],
)

# TODO:
# send email verification via auth_service
# allow signup methods other than email (like sign up w Google)??


# admin only manually create user, not sure if this is needed
@router.post("/", response_model=UserCreateResponse)
async def create_user(
    user: UserCreateRequest,
    user_service: UserService = Depends(get_user_service),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    try:
        return await user_service.create_user(user)
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# admin only get all users
@router.get("/", response_model=UserListResponse)
async def get_users(
    user_service: UserService = Depends(get_user_service),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    try:
        users = user_service.get_users()
        return UserListResponse(users=users, total=len(users))
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# admin only get user by ID
@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    user_service: UserService = Depends(get_user_service),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    try:
        return user_service.get_user_by_id(user_id)
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# admin only update user (mainly for approvals)
@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_update: UserUpdateRequest,
    user_service: UserService = Depends(get_user_service),
    authorized: bool = Depends(has_roles([UserRole.ADMIN])),
):
    try:
        return user_service.update_user_by_id(user_id, user_update)
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# admin only delete user
@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    user_service: UserService = Depends(get_user_service),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    try:
        user_service.delete_user_by_id(user_id)
        return {"message": "User deleted successfully"}
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
