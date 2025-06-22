from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth import has_roles
from app.schemas.user import UserRole
from app.schemas.volunteer_data import (
    VolunteerDataCreateRequest,
    VolunteerDataListResponse,
    VolunteerDataResponse,
    VolunteerDataUpdateRequest,
)
from app.services.implementations.volunteer_data_service import VolunteerDataService
from app.utilities.service_utils import get_volunteer_data_service

router = APIRouter(
    prefix="/volunteer-data",
    tags=["volunteer-data"],
)


# Admin only - create volunteer data
@router.post("/", response_model=VolunteerDataResponse)
async def create_volunteer_data(
    volunteer_data: VolunteerDataCreateRequest,
    volunteer_data_service: VolunteerDataService = Depends(get_volunteer_data_service),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    try:
        return await volunteer_data_service.create_volunteer_data(volunteer_data)
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Admin only - get all volunteer data
@router.get("/", response_model=VolunteerDataListResponse)
async def get_all_volunteer_data(
    volunteer_data_service: VolunteerDataService = Depends(get_volunteer_data_service),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    try:
        volunteer_data_list = await volunteer_data_service.get_all_volunteer_data()
        return VolunteerDataListResponse(
            volunteer_data=volunteer_data_list, total=len(volunteer_data_list)
        )
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Admin only - get volunteer data by ID
@router.get("/{volunteer_data_id}", response_model=VolunteerDataResponse)
async def get_volunteer_data(
    volunteer_data_id: str,
    volunteer_data_service: VolunteerDataService = Depends(get_volunteer_data_service),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    try:
        return await volunteer_data_service.get_volunteer_data_by_id(volunteer_data_id)
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Admin only - get volunteer data by user ID
@router.get("/user/{user_id}", response_model=VolunteerDataResponse)
async def get_volunteer_data_by_user(
    user_id: str,
    volunteer_data_service: VolunteerDataService = Depends(get_volunteer_data_service),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    try:
        return await volunteer_data_service.get_volunteer_data_by_user_id(user_id)
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Admin only - update volunteer data
@router.put("/{volunteer_data_id}", response_model=VolunteerDataResponse)
async def update_volunteer_data(
    volunteer_data_id: str,
    volunteer_data_update: VolunteerDataUpdateRequest,
    volunteer_data_service: VolunteerDataService = Depends(get_volunteer_data_service),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    try:
        return await volunteer_data_service.update_volunteer_data_by_id(
            volunteer_data_id, volunteer_data_update
        )
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Admin only - delete volunteer data
@router.delete("/{volunteer_data_id}")
async def delete_volunteer_data(
    volunteer_data_id: str,
    volunteer_data_service: VolunteerDataService = Depends(get_volunteer_data_service),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    try:
        await volunteer_data_service.delete_volunteer_data_by_id(volunteer_data_id)
        return {"message": "Volunteer data deleted successfully"}
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 