from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.suggested_times import SuggestedTimeCreateRequest, SuggestedTimeEntity
from app.services.implementations.suggested_times_service import SuggestedTimesService
from app.utilities.db_utils import get_db

router = APIRouter(
    prefix="/suggested-times",
    tags=["suggested-times"],
)

def get_schedule_service(db: Session = Depends(get_db)):
    return SuggestedTimesService(db)


@router.post("/", response_model=SuggestedTimeEntity)
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
