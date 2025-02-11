
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.schedule import ScheduleCreate, ScheduleInDB, ScheduleData, ScheduleAdd
from app.services.implementations.schedule_service import ScheduleService
from app.utilities.db_utils import get_db



router = APIRouter(
    prefix="/schedules",
    tags=["schedules"],
)

def get_schedule_service(db: Session = Depends(get_db)):
    return ScheduleService(db)

@router.post("/create", response_model=ScheduleInDB)
async def create_schedule(
    schedule: ScheduleCreate, schedule_service: ScheduleService = Depends(get_schedule_service)
):
    try:
        created_schedule = await schedule_service.create_schedule(schedule)
        return created_schedule
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/complete", response_model=ScheduleInDB)
async def complete_schedule(
    schedule_id: int, schedule_service: ScheduleService = Depends(get_schedule_service)
):
    try:
        completed_schedule = await schedule_service.complete_schedule(schedule_id)
        return completed_schedule
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/get", response_model=ScheduleData)
async def get_schedule(
    schedule_id: int, schedule_service: ScheduleService = Depends(get_schedule_service)
):
    try:
        returned_schedule = await schedule_service.get_schedule(schedule_id)
        return returned_schedule
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# @router.put("/", response_model=ScheduleAdd)
# async def add_to_schedule(
#     schedule: ScheduleAdd, schedule_service: ScheduleService.add_to_schedule(schedule_id, time_block_id)
# ):
#     #try:
#     pass
