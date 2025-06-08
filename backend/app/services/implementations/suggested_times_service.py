import logging
from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Match, TimeBlock, SuggestedTime
from app.schemas.time_block import (
  TimeRange
)
from app.schemas.suggested_times import (
    SuggestedTimeCreateRequest,
    SuggestedTimeGetRequest,
    SuggestedTimeDeleteRequest,
    SuggestedTimeDeleteResponse,
    SuggestedTimeCreateResponse,
    SuggestedTimeGetResponse
)

class SuggestedTimesService:
  def __init__(self, db: Session):
    self.db = db
    self.logger = logging.getLogger(__name__)

  def get_suggested_time_by_match_id(self, req: SuggestedTimeGetRequest) -> SuggestedTimeGetResponse:
    try:
      match_id = req.match_id
      match: Match = self.db.query(Match).filter_by(id=match_id).first()
      suggested_times = match.suggested_time_blocks

      validated_data = SuggestedTimeGetResponse.model_validate({
        "match_id": match_id,
        "suggested_times": suggested_times
      })

      return validated_data
    except Exception as e:
      self.db.rollback()
      self.logger.error(f"Error getting Suggested Time: {str(e)}")
      raise HTTPException(status_code=500, detail=str(e))

  async def create_suggested_time(self, req: SuggestedTimeCreateRequest) -> SuggestedTimeCreateResponse:
    added = 0

    try:
      match_id = req.match_id
      suggested_new_times = req.suggested_new_times

      match = self.db.query(Match).filter_by(id=match_id).one()

      for time_range in suggested_new_times:
        # time format looks like: 2025-03-17 09:30:00
        start_time = time_range.start_time
        end_time = time_range.end_time

        # create timeblocks (0.5 hr) with 15 min spacing
        current_start_time = start_time
        while current_start_time + timedelta(hours=0.5) <= end_time:
          # create time block
          time_block = TimeBlock(start_time=current_start_time)

          # add to suggestedTime
          match.suggested_time_blocks.append(time_block)

          # update current time by 15 minutes for the next block
          current_start_time += timedelta(minutes=15)
          added += 1

      self.db.flush()   # push inserts, get DB-generated fields populated
      validated_data = SuggestedTimeCreateResponse.model_validate({
          "match_id": match_id,
          "added": added
      })
      self.db.commit()
      return validated_data
    except Exception as e:
      self.db.rollback()
      self.logger.error(f"Error creating Suggested Time: {str(e)}")
      raise HTTPException(status_code=500, detail=str(e))

  async def delete_suggested_times_by_match_id(self, req: SuggestedTimeDeleteRequest):
    try:
      match_id = req.match_id
      match = self.db.query(Match).filter_by(id=match_id).one()

      # timeblock deletion
      suggested_time_blocks_to_delete = self.db.query(Match).filter_by(id=match_id).one().suggested_time_blocks
      num_blocks_to_del = len(suggested_time_blocks_to_delete)
      match.suggested_time_blocks.clear()

      self.db.flush()

      validated_data = SuggestedTimeDeleteResponse.model_validate({
        "match_id": match_id,
        "deleted": num_blocks_to_del
      })

      self.db.commit()
      return validated_data
    except Exception as e:
      self.db.rollback()
      self.logger.error(f"Error getting Suggested Time: {str(e)}")
      raise HTTPException(status_code=500, detail=str(e))
