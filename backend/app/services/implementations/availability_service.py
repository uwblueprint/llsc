import logging
from sqlalchemy.orm import joinedload
from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import User, TimeBlock, available_times
from app.schemas.availability import (
    CreateAvailabilityRequest,
    CreateAvailabilityResponse,
    DeleteAvailabilityRequest,
    DeleteAvailabilityResponse,
    GetAvailabilityRequest,
    AvailabilityEntity
)


class AvailabilityService:
    def __init__(self, db: Session):
        self.db = db
        self.logger = logging.getLogger(__name__)

    async def get_availability(self, req: GetAvailabilityRequest) -> AvailabilityEntity:
        """
        Takes a user_id and outputs all time_blocks in a user's Availability
        """
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
        """
        Takes a user_id and a range of desired times. Creates 30 minute time blocks spaced 30 minutes apart for the user's Availability.
        Existing TimeBlocks in add will be silently ignored.
        """
        added = 0
        try:
            user_id = availability.user_id
            user = self.db.query(User).filter_by(id=user_id).one()
            # get user's existing times and create a set            
            existing_start_times = {tb.start_time for tb in user.availability}

            for time_range in availability.available_times:
                # time format looks like: 2025-03-17 09:30:00
                # modify based on the format
                start_time = time_range.start_time
                end_time = time_range.end_time
                
                # create timeblocks (0.5 hr) with 30 min spacing
                current_start_time = start_time
                while current_start_time < end_time:
                    self.logger.error(current_start_time)
                    # check if TimeBlock exists
                    if current_start_time not in existing_start_times:

                        time_block = TimeBlock(start_time=current_start_time)
                        user.availability.append(time_block)
                        added += 1
                    
                    # update current time by 30 minutes for the next block
                    current_start_time += timedelta(hours=0.5)

            self.db.flush()
            validated_data = CreateAvailabilityResponse.model_validate({
                "user_id": user_id,
                "added": added
            })
            self.db.commit()
            return validated_data
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error creating availability: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def delete_availability(self, req: DeleteAvailabilityRequest) -> DeleteAvailabilityResponse:
        """
        Takes a DeleteAvailabilityRequest:
        - delete: TimeBlocks in Availability that should be deleted

        Non-existent TimeBlocks in delete will be silently ignored.
        """
        deleted = 0

        try:
            user: User = self.db.query(User).filter(User.id == req.user_id).one()

            # delete
            for time_range in req.delete:
                curr_start = time_range.start_time
                while curr_start < time_range.end_time:

                    block = (
                                self.db.query(TimeBlock)
                                .join(available_times, TimeBlock.id == available_times.c.time_block_id)
                                .filter(
                                    available_times.c.user_id == user.id,
                                    TimeBlock.start_time == curr_start
                                )
                                .first()
                            )

                    if block:
                        self.db.delete(block)
                        deleted += 1

                    
                    curr_start += timedelta(hours=0.5)

            self.db.flush()

            response = DeleteAvailabilityResponse.model_validate({
                "user_id": req.user_id,
                "deleted": deleted,
                "availability": user.availability
            })


            self.db.commit()
            return response

        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error updating availability for user {req.user_id}: {e}")
            raise HTTPException(status_code=500, detail="Failed to update availability")

