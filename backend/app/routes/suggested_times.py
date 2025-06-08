from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.time_block import TimeBlockBase
from app.schemas.suggested_times import SuggestedTimeCreateRequest, SuggestedTimeEntity
from app.services.implementations.suggested_times_service import SuggestedTimesService
from app.utilities.db_utils import get_db

from typing import List


from app.schemas.suggested_times import (
    SuggestedTimeCreateRequest,
    SuggestedTimeGetRequest,
    SuggestedTimeDeleteRequest,
    SuggestedTimeCreateResponse,
    SuggestedTimeGetResponse,
    SuggestedTimeDeleteResponse
)

router = APIRouter(
    prefix="/suggested-times",
    tags=["suggested-times"],
)

def get_schedule_service(db: Session = Depends(get_db)):
    return SuggestedTimesService(db)

@router.post("/", response_model=SuggestedTimeCreateResponse)
async def create_schedule(
    suggested_time: SuggestedTimeCreateRequest,
    suggested_time_service: SuggestedTimesService = Depends(get_schedule_service),
):
    try:
        created_suggested_time = await suggested_time_service.create_suggested_time(suggested_time)
        return created_suggested_time
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=SuggestedTimeGetResponse)
async def get_schedule(
    match_id: int,
    suggested_time_service: SuggestedTimesService = Depends(get_schedule_service),
):
    try:
        req = SuggestedTimeGetRequest(match_id=match_id)
        suggested_times = suggested_time_service.get_suggested_time_by_match_id(req)
        return suggested_times
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/", response_model=SuggestedTimeDeleteResponse)
async def delete_schedule(
    match_id: int,
    suggested_time_service: SuggestedTimesService = Depends(get_schedule_service),
):
    try:
        req = SuggestedTimeDeleteRequest(match_id=match_id)
        deleted_suggested_time = await suggested_time_service.delete_suggested_times_by_match_id(req)
        return deleted_suggested_time
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

