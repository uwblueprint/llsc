import logging
from datetime import timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Match, TimeBlock
from app.schemas.suggested_times import (
    SuggestedTimeCreateRequest,
    SuggestedTimeCreateResponse,
    SuggestedTimeDeleteRequest,
    SuggestedTimeDeleteResponse,
    SuggestedTimeGetRequest,
    SuggestedTimeGetResponse,
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

            validated_data = SuggestedTimeGetResponse.model_validate(
                {"match_id": match_id, "suggested_times": suggested_times}
            )

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
                start_time = time_range.start_time
                end_time = time_range.end_time

                current_start_time = start_time
                while current_start_time + timedelta(minutes=30) <= end_time:
                    time_block = TimeBlock(start_time=current_start_time)
                    match.suggested_time_blocks.append(time_block)
                    added += 1
                    current_start_time += timedelta(minutes=30)

            self.db.flush()  # push inserts, get DB-generated fields populated
            validated_data = SuggestedTimeCreateResponse.model_validate({"match_id": match_id, "added": added})
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

            validated_data = SuggestedTimeDeleteResponse.model_validate(
                {"match_id": match_id, "deleted": num_blocks_to_del}
            )

            self.db.commit()
            return validated_data
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error getting Suggested Time: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
