from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request

from app.middleware.auth import has_roles
from app.schemas.user import UserRole
from app.schemas.volunteer_data import (
    VolunteerDataCreateRequest,
    VolunteerDataListResponse,
    VolunteerDataPublicSubmission,
    VolunteerDataResponse,
    VolunteerDataUpdateRequest,
)
from app.services.implementations.user_service import UserService
from app.services.implementations.volunteer_data_service import VolunteerDataService
from app.utilities.service_utils import get_user_service, get_volunteer_data_service

router = APIRouter(
    prefix="/volunteer-data",
    tags=["volunteer-data"],
)


# Authenticated endpoint - volunteers submit their secondary application data
@router.post("/submit", response_model=VolunteerDataResponse)
async def submit_volunteer_data(
    volunteer_data: VolunteerDataPublicSubmission,
    request: Request,
    volunteer_data_service: VolunteerDataService = Depends(get_volunteer_data_service),
    user_service: UserService = Depends(get_user_service),
    authorized: bool = has_roles([UserRole.VOLUNTEER, UserRole.ADMIN]),
):
    """Endpoint for authenticated volunteers to submit their secondary application data"""
    try:
        # Get current user from request state (set by auth middleware)
        current_user_auth_id = request.state.user_id

        try:
            user_id_str = await user_service.get_user_id_by_auth_id(current_user_auth_id)
            user_id = UUID(user_id_str)
        except ValueError as err:
            raise HTTPException(status_code=404, detail=str(err)) from err

        create_request = VolunteerDataCreateRequest(
            user_id=user_id,
            experience=volunteer_data.experience,
            references_json=volunteer_data.references_json,
            additional_comments=volunteer_data.additional_comments,
        )
        return await volunteer_data_service.create_volunteer_data(create_request)
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
        return VolunteerDataListResponse(volunteer_data=volunteer_data_list, total=len(volunteer_data_list))
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
        return await volunteer_data_service.update_volunteer_data_by_id(volunteer_data_id, volunteer_data_update)
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
