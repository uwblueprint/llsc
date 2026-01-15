from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.middleware.auth import has_roles
from app.models.User import User
from app.schemas.user import (
    UserCreateRequest,
    UserCreateResponse,
    UserListResponse,
    UserResponse,
    UserRole,
    UserUpdateRequest,
)
from app.schemas.user_data import UserDataUpdateRequest
from app.services.implementations.user_service import UserService
from app.utilities.db_utils import get_db
from app.utilities.service_utils import get_user_service

router = APIRouter(
    prefix="/users",
    tags=["users"],
)

# TODO:
# send email verification via auth_service
# allow signup methods other than email (like sign up w Google)??


# admin only manually create user, not sure if this is needed
@router.post("", response_model=UserCreateResponse)
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
@router.get("", response_model=UserListResponse)
async def get_users(
    admin: Optional[bool] = Query(False, description="If true, returns admin users only"),
    user_service: UserService = Depends(get_user_service),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    try:
        if admin:
            users = await user_service.get_admins()
        else:
            users = await user_service.get_users()
        return UserListResponse(users=users, total=len(users))
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# get user by ID (admin or self)
@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
):
    try:
        # Get current user's auth_id from request state
        current_user_auth_id = request.state.user_id
        current_user = db.query(User).filter(User.auth_id == current_user_auth_id).first()

        if not current_user:
            raise HTTPException(status_code=401, detail="User not found")

        # Check if user is admin or accessing their own profile
        is_admin = current_user.role_id == 3  # Admin role_id
        is_self = str(current_user.id) == str(user_id)

        if not (is_admin or is_self):
            raise HTTPException(status_code=403, detail="You can only access your own profile")

        return await user_service.get_user_by_id(user_id)
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
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    try:
        return await user_service.update_user_by_id(user_id, user_update)
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# admin only update user_data (cancer experience, treatments, experiences, etc.)
@router.patch("/{user_id}/user-data", response_model=UserResponse)
async def update_user_data(
    user_id: str,
    user_data_update: UserDataUpdateRequest,
    user_service: UserService = Depends(get_user_service),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    try:
        return await user_service.update_user_data_by_id(user_id, user_data_update)
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
        await user_service.delete_user_by_id(user_id)
        return {"message": "User deleted successfully"}
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# soft delete user (admin or self)
@router.post("/{user_id}/deactivate")
async def deactivate_user(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
):
    try:
        # Get current user's auth_id from request state
        current_user_auth_id = request.state.user_id
        current_user = db.query(User).filter(User.auth_id == current_user_auth_id).first()

        if not current_user:
            raise HTTPException(status_code=401, detail="User not found")

        # Get target user
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="Target user not found")

        # Check if user is admin or modifying themselves
        is_admin = current_user.role_id == 3  # Admin role_id
        is_self = str(current_user.id) == str(user_id)

        if not (is_admin or is_self):
            raise HTTPException(status_code=403, detail="You can only deactivate your own account")

        await user_service.soft_delete_user_by_id(user_id)
        return {"message": "User deactivated successfully"}
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# reactivate user (admin or self)
@router.post("/{user_id}/reactivate")
async def reactivate_user(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
    user_service: UserService = Depends(get_user_service),
):
    try:
        # Get current user's auth_id from request state
        current_user_auth_id = request.state.user_id
        current_user = db.query(User).filter(User.auth_id == current_user_auth_id).first()

        if not current_user:
            raise HTTPException(status_code=401, detail="User not found")

        # Get target user
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="Target user not found")

        # Check if user is admin or modifying themselves
        is_admin = current_user.role_id == 3  # Admin role_id
        is_self = str(current_user.id) == str(user_id)

        if not (is_admin or is_self):
            raise HTTPException(status_code=403, detail="You can only reactivate your own account")

        await user_service.reactivate_user_by_id(user_id)
        return {"message": "User reactivated successfully"}
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
