import logging
from uuid import UUID
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.interfaces.matching_service import IMatchingService
from app.models import Matches
from app.schemas.match import MatchCreateRequest, MatchUpdateRequest, MatchResponse


class MatchingService(IMatchingService):
    def __init__(self, db: Session):
        self.db = db
        self.logger = logging.getLogger(__name__)

    async def create_match(self, match_data: MatchCreateRequest) -> MatchResponse:
        """Creates a new match between two users."""
        try:

            existing_match = self.db.query(Matches).filter(
                Matches.user1_id == match_data.user1_id, Matches.user2_id == match_data.user2_id
            ).first()

            if existing_match:
                raise HTTPException(status_code=409, detail="Match already exists")

            db_match = Matches(u
                user1_id=match_data.ser1_id,
                user2_id=match_data.user2_id,
                metadata=match_data.metadata
            )

            self.db.add(db_match)
            self.db.commit()
            self.db.refresh(db_match)

            return MatchResponse.model_validate(db_match)

        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error creating match: {str(e)}")
            raise HTTPException(status_code=500, detail="Error creating match")

    async def update_match(self, match_id: UUID, match_data: MatchUpdateRequest) -> MatchResponse:
        """Updates an existing match."""
        db_match = self.db.query(Matches).filter(Matches.id == match_id).first()

        if not db_match:
            raise HTTPException(status_code=404, detail="Match not found")

        if match_data.metadata:
            db_match.metadata = match_data.metadata

        self.db.commit()
        self.db.refresh(db_match)

        return MatchResponse.model_validate(db_match)

    async def get_match(self, match_id: UUID) -> MatchResponse:
        """Fetches a match by ID."""
        pass
    
    async def delete_match(self, match_id: UUID) -> None:
        """Deletes a match."""
        pass

    async def run_algorithm(self, top_k: int) -> dict:
        """Runs the matching algorithm."""
        pass

    