import logging
from uuid import UUID
from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Schedule, TimeBlock
# from app.schemas.schedule import UserCreate, UserInDB, UserRole
# from app.schemas.time_block import UserCreate, UserInDB, UserRole
from app.services.interfaces.schedule_service import IScheduleService
from app.schemas.schedule import ScheduleCreate, ScheduleInDB, ScheduleAdd, ScheduleData

class ScheduleService(IScheduleService):
    def __init__(self, db: Session):
        self.db = db
        self.logger = logging.getLogger(__name__)

    async def create_schedule(self, schedule: ScheduleCreate) -> ScheduleInDB:

        # create a schedule
        # loop through the body
        # for each time block, call create_time_block(scheduleId)
     
        '''
        # {
        #     [
        #         {
        #             # time block 1
                        start_time: ...
                        end_time: ...
        #         },
        #         {
        #             # time block 2
        #         }
        #     ]

        # }
        '''
        pass

    async def create_time_block(self, schedule_id: UUID, time_block: TimeBlockBase) -> TimeBlockInDB:
        # takes a schedule id
        # create a time block in the db


        # link the schedule + the time block together
        pass

    async def add_to_schedule(self, schedule: ScheduleAdd):
        pass
    
    async def remove_from_schedule(self, schedule: ScheduleRemove):

        # GET schedule
        # return schedule state, time_blocks
        #

        # click on the timeblock
        # PUT request {
            # timeBlockId: ...
        #}
        pass

    async def select_time(self, schedule_id: UUID, time: datetime):

        # loop through each time block associated with the schedule
        # check if time fits within a given timeblock (+1 hour)
        # 
        # if it does match, update the state of the schedule to SCHEDULED
        # if it doesn't match, then return an error
        pass
    
    async def complete_schedule(self, schedule_id: UUID):

        # update schedule state to COMPLETED
        pass

    async def get_schedule(self, schedule_id: UUID) -> ScheduleData:
        
        # returns a schedule
        pass


    

    
