import logging

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Match, MatchStatus, TimeBlock
from app.schemas.match import SubmitMatchRequest, SubmitMatchResponse


class MatchService:
    def __init__(self, db: Session):
        self.db = db
        self.logger = logging.getLogger(__name__)

    async def submit_time(self, req: SubmitMatchRequest) -> SubmitMatchResponse:
        try:
            match = self.db.get(Match, req.match_id)
            if not match:
                raise HTTPException(404, f"Match {req.match_id} not found")

            block = self.db.get(TimeBlock, req.time_block_id)
            if not block:
                raise HTTPException(404, f"TimeBlock {req.time_block_id} not found")

            if block.confirmed_match and block.confirmed_match.id != match.id:
                raise HTTPException(400, "TimeBlock already confirmed for another match")

            # confirm time block in match and update status to confirmed
            match.chosen_time_block_id = block.id
            match.confirmed_time = block

            confirmed_status = self.db.query(MatchStatus).filter_by(name="confirmed").first()
            if not confirmed_status:
                raise HTTPException(500, "Match status 'confirmed' not configured")

            match.match_status = confirmed_status

            self.db.flush()

            response = SubmitMatchResponse.model_validate(
                {
                    "match_id": match.id,
                    "time_block": block,
                }
            )

            self.db.commit()
            return response

        except HTTPException:
            self.db.rollback()
            raise
        except Exception as exc:
            self.db.rollback()
            self.logger.error(f"Error confirming time for match {req.match_id}: {exc}")
            raise HTTPException(status_code=500, detail="Failed to confirm time")
