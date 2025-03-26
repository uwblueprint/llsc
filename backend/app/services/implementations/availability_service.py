import logging
from sqlalchemy.orm import joinedload
from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import User, TimeBlock
from app.schemas.availability import (
    CreateAvailabilityRequest,
    CreateAvailabilityResponse,
    GetAvailabilityRequest,
    AvailabilityEntity
)


class AvailabilityService:
    def __init__(self, db: Session):
        self.db = db
        self.logger = logging.getLogger(__name__)

    async def get_availability(self, req: GetAvailabilityRequest) -> AvailabilityEntity:
        try:
            user_id = req.user_id
            user = self.db.query(User).filter_by(id=user_id).one()
            validated_data = AvailabilityEntity.model_validate({
                "user_id": user_id,
                "available_times": user.availability
            })
            return validated_data
            
        except Exception as e:
            self.logger.error(f"Error getting availability: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def create_availability(self, availability: CreateAvailabilityRequest) -> CreateAvailabilityResponse:
        try:
            user_id = availability.user_id
            user = self.db.query(User).filter_by(id=user_id).one()
            for time_range in availability.available_times:
                # time format looks like: 2025-03-17 09:30:00
                # modify based on the format
                start_time = time_range.start_time
                end_time = time_range.end_time
                
                # create timeblocks (1.5 hr) with 15 min spacing
                current_start_time = start_time
                while current_start_time + timedelta(hours=1.5) <= end_time:
                    
                    # create time block
                    time_block = TimeBlock(start_time=current_start_time)

                    # add to user's availability
                    user.availability.append(time_block)

                    # update current time by 15 minutes for the next block
                    current_start_time += timedelta(minutes=15)
            self.db.flush()
            validated_data = CreateAvailabilityResponse.model_validate({
                "user_id": user_id
            })
            self.db.commit()
            return validated_data
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error creating availability: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
