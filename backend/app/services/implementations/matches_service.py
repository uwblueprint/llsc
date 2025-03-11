import logging
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.interfaces.match_service import IMatchService
from app.models import Matches
from app.schemas.match import (
    MatchResponse
)
from app.utilities.constants import LOGGER_NAME

class MatchService(IMatchService):
    def __init__(self, db: Session):
        self.db = db
        self.logger = logging.getLogger(LOGGER_NAME("match_service"))

    async def get_all_matches(self) -> list[MatchResponse]:
        """Get all matches in the system"""
        try:
            matches = self.db.query(Matches).all()
            return [MatchResponse.model_validate(match) for match in matches]
        except Exception as e:
            self.logger.error(f"Error retrieving all matches: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error retrieving matches: {str(e)}")

    async def get_match(self, user_id: UUID) -> MatchResponse:
        """Get a specific match by ID"""
        try:
            match = self.db.query(Matches).filter(Matches.id == user_id).first()
            if not match:
                raise HTTPException(status_code=404, detail=f"Match with ID {user_id} not found")
            
            return MatchResponse.model_validate(match)
        except HTTPException as http_ex:
            raise http_ex
        except Exception as e:
            self.logger.error(f"Error retrieving match {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error retrieving match: {str(e)}")

    async def delete_match(self, user_id: UUID) -> bool:
        """Delete a match by its ID"""
        try:
            match = self.db.query(Matches).filter(Matches.id == user_id).first()
            if not match:
                return False

            self.db.delete(match)
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error deleting match {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error deleting match: {str(e)}")