from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth import has_roles
from app.schemas.user import UserRole
from app.schemas.user_data import (
    UserDataCreateRequest,
    UserDataResponse,
    UserDataUpdateRequest,
)
from app.services.implementations.user_data_service import UserDataService
from app.utilities.service_utils import get_user_data_service

router = APIRouter(
    prefix="/user-data",
    tags=["user-data"],
)


@router.post("/", response_model=UserDataResponse)
async def create_user_data(
    user_data: UserDataCreateRequest,
    user_data_service: UserDataService = Depends(get_user_data_service),
    authorized: bool = has_roles([UserRole.ADMIN, UserRole.PARTICIPANT, UserRole.VOLUNTEER]),
):
    """Create user data for intake form"""
    try:
        return user_data_service.create_user_data(user_data)
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/{user_id}", response_model=UserDataResponse)
async def get_user_data_by_user_id(
    user_id: UUID,
    user_data_service: UserDataService = Depends(get_user_data_service),
    authorized: bool = has_roles([UserRole.ADMIN, UserRole.PARTICIPANT, UserRole.VOLUNTEER]),
):
    """Get user data by user ID"""
    try:
        return user_data_service.get_user_data_by_user_id(user_id)
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_data_id}", response_model=UserDataResponse)
async def get_user_data_by_id(
    user_data_id: UUID,
    user_data_service: UserDataService = Depends(get_user_data_service),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    """Get user data by its ID"""
    try:
        return user_data_service.get_user_data_by_id(user_data_id)
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/user/{user_id}", response_model=UserDataResponse)
async def update_user_data_by_user_id(
    user_id: UUID,
    user_data: UserDataUpdateRequest,
    user_data_service: UserDataService = Depends(get_user_data_service),
    authorized: bool = has_roles([UserRole.ADMIN, UserRole.PARTICIPANT, UserRole.VOLUNTEER]),
):
    """Update user data by user ID"""
    try:
        return user_data_service.update_user_data_by_user_id(user_id, user_data)
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{user_data_id}")
async def delete_user_data_by_id(
    user_data_id: UUID,
    user_data_service: UserDataService = Depends(get_user_data_service),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    """Delete user data by its ID"""
    try:
        user_data_service.delete_user_data_by_id(user_data_id)
        return {"message": f"User data {user_data_id} deleted successfully"}
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/user/{user_id}")
async def delete_user_data_by_user_id(
    user_id: UUID,
    user_data_service: UserDataService = Depends(get_user_data_service),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    """Delete user data by user ID"""
    try:
        user_data_service.delete_user_data_by_user_id(user_id)
        return {"message": f"User data for user {user_id} deleted successfully"}
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 