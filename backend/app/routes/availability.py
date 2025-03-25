from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.utilities.db_utils import get_db
from app.schemas.availability import AvailabilityEntity, CreateAvailabilityRequest
from app.services.implementations.availability_service import AvailabilityService

router = APIRouter(
    prefix="/availability",
    tags=["availability"],
)

def get_availability_service(db: Session = Depends(get_db)):
    return AvailabilityService(db)

@router.post("/", response_model=AvailabilityEntity)
async def create_availability(
    availability: CreateAvailabilityRequest,
    availability_service: AvailabilityService = Depends(get_availability_service),
):
    try:
        created_availability = await availability_service.create_availability(availability)
        # returns user id
        return created_availability
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))
