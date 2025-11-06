from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.middleware.auth import has_roles
from app.schemas.availability import (
    AvailabilityEntity,
    CreateAvailabilityRequest,
    CreateAvailabilityResponse,
    DeleteAvailabilityRequest,
    DeleteAvailabilityResponse,
    GetAvailabilityRequest,
)
from app.schemas.user import UserRole
from app.services.implementations.availability_service import AvailabilityService
from app.utilities.db_utils import get_db

router = APIRouter(
    prefix="/availability",
    tags=["availability"],
)


def get_availability_service(db: Session = Depends(get_db)):
    return AvailabilityService(db)


@router.get("/", response_model=AvailabilityEntity)
async def get_availability(
    user_id: UUID = Query(..., description="User ID to fetch availability"),
    availability_service: AvailabilityService = Depends(get_availability_service),
    authorized: bool = has_roles([UserRole.ADMIN, UserRole.VOLUNTEER]),
):
    try:
        req = GetAvailabilityRequest(user_id=user_id)
        available_times = await availability_service.get_availability(req)
        return available_times
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=CreateAvailabilityResponse)
async def create_availability(
    availability: CreateAvailabilityRequest,
    availability_service: AvailabilityService = Depends(get_availability_service),
    authorized: bool = has_roles([UserRole.ADMIN, UserRole.VOLUNTEER]),
):
    try:
        created = await availability_service.create_availability(availability)
        # returns user id
        return created
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/", response_model=CreateAvailabilityResponse)
async def update_availability(
    availability: CreateAvailabilityRequest,
    availability_service: AvailabilityService = Depends(get_availability_service),
    authorized: bool = has_roles([UserRole.ADMIN, UserRole.VOLUNTEER]),
):
    """
    Completely replaces user's availability with the provided time slots.
    Deletes all existing availability and creates new ones.
    """
    try:
        updated = await availability_service.update_availability(availability)
        return updated
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/", response_model=DeleteAvailabilityResponse)
async def delete_availability(
    availability: DeleteAvailabilityRequest,
    availability_service: AvailabilityService = Depends(get_availability_service),
    authorized: bool = has_roles([UserRole.ADMIN, UserRole.VOLUNTEER]),
):
    try:
        deleted = await availability_service.delete_availability(availability)
        return deleted
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))
