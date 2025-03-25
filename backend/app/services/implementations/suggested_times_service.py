import logging
from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Match, TimeBlock, SuggestedTime
from app.schemas.time_block import (
  TimeRange
)
from app.schemas.suggested_times import (
  SuggestedTimeEntity,
    SuggestedTimeCreateRequest,
    SuggestedTimeDeleteRequest,
    SuggestedTimeUpdateRequest
)

class SuggestedTimesService:
  def __init__(self, db: Session):
    self.db = db
    self.logger = logging.getLogger(__name__)
  
  def get_suggested_time_by_id(self, suggested_time_id):
    pass

  async def create_suggested_time(self, suggested_time_req: SuggestedTimeCreateRequest):
    try:
      match_id = suggested_time_blocks = suggested_time_req.match_id
      suggested_time_blocks = suggested_time_req.suggested_time_blocks
      suggested_new_times = suggested_time_req.suggested_new_times

      match = self.db.query(Match).filter_by(id=match_id).one()

      for suggested_time_block in suggested_time_blocks:
        match.suggested_time_blocks.append(suggested_time_block)

      for time_range in suggested_new_times:
        print(suggested_new_times)
        # time format looks like: 2025-03-17 09:30:00
        start_time = time_range.start_time
        end_time = time_range.end_time

        # create timeblocks (1.5 hr) with 15 min spacing
        current_start_time = start_time
        while current_start_time + timedelta(hours=1.5) <= end_time:
          print(current_start_time)
          # create time block
          time_block = TimeBlock(start_time=current_start_time)

          # add to suggestedTime
          match.suggested_time_blocks.append(time_block)

          # update current time by 15 minutes for the next block
          current_start_time += timedelta(minutes=15)

          self.db.commit()

      return SuggestedTimeEntity.model_validate({"match_id": match_id})
    except Exception as e:
      self.db.rollback()
      self.logger.error(f"Error creating Suggested Time: {str(e)}")
      raise HTTPException(status_code=500, detail=str(e))
