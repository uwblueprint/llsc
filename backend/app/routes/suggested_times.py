
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.middleware.auth import has_roles
from app.schemas.suggested_times import (
    SuggestedTimeCreateRequest,
    SuggestedTimeCreateResponse,
    SuggestedTimeDeleteRequest,
    SuggestedTimeDeleteResponse,
    SuggestedTimeGetRequest,
    SuggestedTimeGetResponse,
)
from app.schemas.user import UserRole
from app.services.implementations.suggested_times_service import SuggestedTimesService
from app.utilities.db_utils import get_db

router = APIRouter(
    prefix="/suggested-times",
    tags=["suggested-times"],
)

def get_suggested_times_service(db: Session = Depends(get_db)):
    return SuggestedTimesService(db)

@router.post("/", response_model=SuggestedTimeCreateResponse)
async def create_suggested_times(
    suggested_time: SuggestedTimeCreateRequest,
    time_service: SuggestedTimesService = Depends(get_suggested_times_service),
    authorized: bool = has_roles([UserRole.ADMIN, UserRole.PARTICIPANT]),
):
    try:
        created = await time_service.create_suggested_time(suggested_time)
        return created
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=SuggestedTimeGetResponse)
async def get_suggested_times(
    match_id: int,
    time_service: SuggestedTimesService = Depends(get_suggested_times_service),
    authorized: bool = has_roles([UserRole.ADMIN, UserRole.VOLUNTEER]),
):
    try:
        req = SuggestedTimeGetRequest(match_id=match_id)
        suggested_times = time_service.get_suggested_time_by_match_id(req)
        return suggested_times
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/", response_model=SuggestedTimeDeleteResponse)
async def delete_suggested_times(
    match_id: int,
    time_service: SuggestedTimesService = Depends(get_suggested_times_service),
    authorized: bool = has_roles([UserRole.ADMIN, UserRole.VOLUNTEER]),
):
    try:
        req = SuggestedTimeDeleteRequest(match_id=match_id)
        deleted = await time_service.delete_suggested_times_by_match_id(req)
        return deleted
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

