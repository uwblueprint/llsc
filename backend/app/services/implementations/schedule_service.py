# import logging
# from datetime import datetime

# from fastapi import HTTPException
# from sqlalchemy.orm import Session

# from app.models import TimeBlock
# from app.schemas.schedule import (
#     ScheduleCreateRequest,
#     ScheduleDeleteRequest,
#     ScheduleEntity,
#     ScheduleStatus,
#     ScheduleUpdateRequest,
# )


# class ScheduleService:
#     def __init__(self, db: Session):
#         self.db = db
#         self.logger = logging.getLogger(__name__)

#     def get_schedule_by_id(self, schedule_id):
#         pass

#     async def create_schedule(self, schedule: ScheduleCreateRequest) -> ScheduleEntity:
#         try:
#             db_schedule = Schedule(
#                 scheduled_time=None,
#                 duration=None,
#                 status_id=ScheduleStatus.to_schedule_status_id(
#                     "PENDING_VOLUNTEER_RESPONSE"
#                 ),
#             )

#             db_schedule.time_blocks = []

#             # Add time blocks to the Schedule via the relationship
#             for tb in schedule.time_blocks:
#                 db_schedule.time_blocks.append(
#                     TimeBlock(start_time=tb.start_time, end_time=tb.end_time)
#                 )

#             # Add the Schedule object (and its time blocks) to the session
#             # Time Blocks are inserted into db because of SqlAlchemy relationships
#             self.db.add(db_schedule)
#             self.db.commit()
#             self.db.refresh(db_schedule)

#             return ScheduleEntity.model_validate(db_schedule)
#         except Exception as e:
#             self.db.rollback()
#             self.logger.error(f"Error creating Schedule: {str(e)}")
#             raise HTTPException(status_code=500, detail=str(e))

#     async def add_to_schedule(self, schedule: ScheduleUpdateRequest):
#         pass

#     async def remove_from_schedule(self, schedule: ScheduleDeleteRequest):
#         # GET schedule
#         # return schedule state, time_blocks
#         #

#         # click on the timeblock
#         # PUT request {
#         # timeBlockId: ...
#         # }
#         pass

#     async def select_time(self, schedule_id: int, time: datetime):
#         # loop through each time block associated with the schedule
#         # check if time fits within a given timeblock (+1 hour)
#         #
#         # if it does match, update the state of the schedule to SCHEDULED
#         # if it doesn't match, then return an error
#         pass

#     async def complete_schedule(self, schedule_id: int):
#         # update schedule state to COMPLETED
#         pass

#     async def get_schedule(self, schedule_id: int) -> ScheduleGetResponse:
#         # returns a schedule
#         pass
