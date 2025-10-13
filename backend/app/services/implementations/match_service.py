import logging
from typing import List
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models import Match, MatchStatus, TimeBlock, User
from app.schemas.match import (
    MatchCreateRequest,
    MatchCreateResponse,
    MatchDetailResponse,
    MatchListResponse,
    MatchResponse,
    MatchUpdateRequest,
    MatchVolunteerSummary,
    SubmitMatchRequest,
    SubmitMatchResponse,
)
from app.schemas.time_block import TimeBlockEntity
from app.schemas.user import UserRole


class MatchService:
    def __init__(self, db: Session):
        self.db = db
        self.logger = logging.getLogger(__name__)

    async def create_matches(self, req: MatchCreateRequest) -> MatchCreateResponse:
        try:
            participant: User | None = self.db.get(User, req.participant_id)
            if not participant:
                raise HTTPException(404, f"Participant {req.participant_id} not found")
            if participant.role is None or participant.role.name != UserRole.PARTICIPANT:
                raise HTTPException(400, "Selected user is not a participant")

            status_name = req.match_status or "pending"
            status = self.db.query(MatchStatus).filter_by(name=status_name).first()
            if not status:
                raise HTTPException(400, f"Invalid match status: {status_name}")

            created_matches: List[Match] = []

            for volunteer_id in req.volunteer_ids:
                volunteer: User | None = self.db.get(User, volunteer_id)
                if not volunteer:
                    raise HTTPException(404, f"Volunteer {volunteer_id} not found")
                if volunteer.role is None or volunteer.role.name != UserRole.VOLUNTEER:
                    raise HTTPException(400, "Match volunteers must have volunteer role")

                match = Match(
                    participant_id=participant.id,
                    volunteer_id=volunteer.id,
                    match_status=status,
                )
                self.db.add(match)
                created_matches.append(match)

            self.db.flush()
            self.db.commit()

            for match in created_matches:
                self.db.refresh(match)

            responses = [self._build_match_response(match) for match in created_matches]
            return MatchCreateResponse(matches=responses)

        except HTTPException:
            self.db.rollback()
            raise
        except Exception as exc:
            self.db.rollback()
            self.logger.error(f"Error creating matches for participant {req.participant_id}: {exc}")
            raise HTTPException(status_code=500, detail="Failed to create matches")

    async def update_match(self, match_id: int, req: MatchUpdateRequest) -> MatchResponse:
        try:
            match: Match | None = self.db.get(Match, match_id)
            if not match:
                raise HTTPException(404, f"Match {match_id} not found")

            if req.volunteer_id is not None:
                volunteer: User | None = self.db.get(User, req.volunteer_id)
                if not volunteer:
                    raise HTTPException(404, f"Volunteer {req.volunteer_id} not found")
                if volunteer.role is None or volunteer.role.name != UserRole.VOLUNTEER:
                    raise HTTPException(400, "Match volunteers must have volunteer role")
                match.volunteer_id = volunteer.id

            if req.match_status is not None:
                status = self.db.query(MatchStatus).filter_by(name=req.match_status).first()
                if not status:
                    raise HTTPException(400, f"Invalid match status: {req.match_status}")
                match.match_status = status

            if req.chosen_time_block_id is not None:
                block = self.db.get(TimeBlock, req.chosen_time_block_id)
                if not block:
                    raise HTTPException(404, f"TimeBlock {req.chosen_time_block_id} not found")
                match.chosen_time_block_id = block.id
                match.confirmed_time = block
            elif req.clear_chosen_time:
                match.chosen_time_block_id = None
                match.confirmed_time = None

            self.db.flush()
            self.db.commit()
            self.db.refresh(match)

            return self._build_match_response(match)

        except HTTPException:
            self.db.rollback()
            raise
        except Exception as exc:
            self.db.rollback()
            self.logger.error(f"Error updating match {match_id}: {exc}")
            raise HTTPException(status_code=500, detail="Failed to update match")

    async def get_matches_for_participant(self, participant_id: UUID) -> MatchListResponse:
        try:
            matches: List[Match] = (
                self.db.query(Match)
                .options(
                    joinedload(Match.volunteer),
                    joinedload(Match.match_status),
                    joinedload(Match.suggested_time_blocks),
                    joinedload(Match.confirmed_time),
                )
                .filter(Match.participant_id == participant_id)
                .order_by(Match.created_at.desc())
                .all()
            )

            responses = [self._build_match_detail(match) for match in matches]
            return MatchListResponse(matches=responses)
        except HTTPException:
            raise
        except Exception as exc:
            self.logger.error(f"Error fetching matches for participant {participant_id}: {exc}")
            raise HTTPException(status_code=500, detail="Failed to fetch matches")

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

    def _build_match_response(self, match: Match) -> MatchResponse:
        match_status_name = match.match_status.name if match.match_status else ""
        return MatchResponse(
            id=match.id,
            participant_id=match.participant_id,
            volunteer_id=match.volunteer_id,
            match_status=match_status_name,
            chosen_time_block_id=match.chosen_time_block_id,
            created_at=match.created_at,
            updated_at=match.updated_at,
        )

    def _build_match_detail(self, match: Match) -> MatchDetailResponse:
        volunteer = match.volunteer
        if not volunteer:
            raise HTTPException(500, "Match is missing volunteer data")

        volunteer_summary = MatchVolunteerSummary(
            id=volunteer.id,
            first_name=volunteer.first_name,
            last_name=volunteer.last_name,
            email=volunteer.email,
        )

        suggested_blocks = [
            TimeBlockEntity.model_validate(time_block)
            for time_block in sorted(
                match.suggested_time_blocks,
                key=lambda tb: tb.start_time,
            )
        ]

        chosen_block = None
        if match.confirmed_time:
            chosen_block = TimeBlockEntity.model_validate(match.confirmed_time)

        match_status_name = match.match_status.name if match.match_status else ""

        return MatchDetailResponse(
            id=match.id,
            participant_id=match.participant_id,
            volunteer=volunteer_summary,
            match_status=match_status_name,
            chosen_time_block=chosen_block,
            suggested_time_blocks=suggested_blocks,
            created_at=match.created_at,
            updated_at=match.updated_at,
        )
