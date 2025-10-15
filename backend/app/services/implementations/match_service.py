import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models import Match, MatchStatus, TimeBlock, User
from app.schemas.match import (
    MatchCreateRequest,
    MatchCreateResponse,
    MatchDetailResponse,
    MatchListResponse,
    MatchRequestNewVolunteersResponse,
    MatchResponse,
    MatchUpdateRequest,
    MatchVolunteerSummary,
)
from app.schemas.time_block import TimeBlockEntity, TimeRange
from app.schemas.user import UserRole

SCHEDULE_CLEANUP_STATUSES = {"pending", "requesting_new_times", "requesting_new_volunteers"}
ACTIVE_MATCH_STATUSES = {
    "pending",
    "requesting_new_times",
    "requesting_new_volunteers",
    "confirmed",
}


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
                volunteer: User | None = (
                    self.db.query(User).options(joinedload(User.availability)).filter(User.id == volunteer_id).first()
                )
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

                self._attach_initial_suggested_times(match, volunteer)
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
            if not match or match.deleted_at is not None:
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

    async def schedule_match(
        self,
        match_id: int,
        time_block_id: int,
        acting_participant_id: Optional[UUID] = None,
    ) -> MatchDetailResponse:
        try:
            match: Match | None = (
                self.db.query(Match)
                .options(
                    joinedload(Match.participant),
                    joinedload(Match.suggested_time_blocks),
                    joinedload(Match.match_status),
                )
                .filter(Match.id == match_id, Match.deleted_at.is_(None))
                .first()
            )
            if not match:
                raise HTTPException(404, f"Match {match_id} not found")

            if acting_participant_id and match.participant_id != acting_participant_id:
                raise HTTPException(status_code=403, detail="Cannot modify another participant's match")

            block = self.db.get(TimeBlock, time_block_id)
            if not block:
                raise HTTPException(404, f"TimeBlock {time_block_id} not found")

            # Validate that the time block belongs to this match's suggested times
            if block not in match.suggested_time_blocks:
                raise HTTPException(
                    400, "Selected time is not available for this match. Please choose from suggested times."
                )

            # Check if volunteer is already confirmed at this exact time (prevent double-booking)
            conflicting_match = (
                self.db.query(Match)
                .join(TimeBlock, Match.chosen_time_block_id == TimeBlock.id)
                .filter(
                    Match.volunteer_id == match.volunteer_id,
                    TimeBlock.start_time == block.start_time,
                    Match.id != match.id,
                    Match.deleted_at.is_(None),
                    Match.match_status.has(MatchStatus.name == "confirmed"),
                )
                .first()
            )

            if conflicting_match:
                raise HTTPException(
                    409,
                    "This volunteer has already confirmed another appointment at this time. "
                    "Please choose a different time slot.",
                )

            match.chosen_time_block_id = block.id
            match.confirmed_time = block

            confirmed_status = self.db.query(MatchStatus).filter_by(name="confirmed").first()
            if not confirmed_status:
                raise HTTPException(500, "Match status 'confirmed' not configured")
            match.match_status = confirmed_status

            participant_id = match.participant_id

            other_matches: List[Match] = (
                self.db.query(Match)
                .options(
                    joinedload(Match.match_status),
                    joinedload(Match.suggested_time_blocks),
                    joinedload(Match.confirmed_time),
                )
                .filter(
                    Match.participant_id == participant_id,
                    Match.id != match.id,
                    Match.deleted_at.is_(None),
                )
                .all()
            )

            for other in other_matches:
                status_name = other.match_status.name if other.match_status else None
                if status_name in SCHEDULE_CLEANUP_STATUSES:
                    self._delete_match(other)

            self.db.flush()
            self.db.commit()
            self.db.refresh(match)

            return self._build_match_detail(match)

        except HTTPException:
            self.db.rollback()
            raise
        except Exception as exc:
            self.db.rollback()
            self.logger.error(f"Error scheduling match {match_id}: {exc}")
            raise HTTPException(status_code=500, detail="Failed to schedule match")

    async def request_new_times(
        self,
        match_id: int,
        time_ranges: List[TimeRange],
        acting_participant_id: Optional[UUID] = None,
    ) -> MatchDetailResponse:
        try:
            match: Match | None = (
                self.db.query(Match)
                .options(joinedload(Match.suggested_time_blocks), joinedload(Match.match_status))
                .filter(Match.id == match_id, Match.deleted_at.is_(None))
                .first()
            )
            if not match:
                raise HTTPException(404, f"Match {match_id} not found")

            if acting_participant_id and match.participant_id != acting_participant_id:
                raise HTTPException(status_code=403, detail="Cannot modify another participant's match")

            if match.chosen_time_block_id is not None:
                raise HTTPException(400, "Cannot request new times after a call is scheduled")

            for existing in list(match.suggested_time_blocks):
                match.suggested_time_blocks.remove(existing)
                self.db.delete(existing)

            added = 0
            for time_range in time_ranges:
                current_start = time_range.start_time
                end_time = time_range.end_time
                while current_start + timedelta(minutes=30) <= end_time:
                    time_block = TimeBlock(start_time=current_start)
                    match.suggested_time_blocks.append(time_block)
                    added += 1
                    current_start += timedelta(minutes=30)

            if added == 0:
                raise HTTPException(400, "No suggested time blocks generated from provided ranges")

            requesting_status = self.db.query(MatchStatus).filter_by(name="requesting_new_times").first()
            if not requesting_status:
                raise HTTPException(500, "Match status 'requesting_new_times' not configured")

            match.match_status = requesting_status

            self.db.flush()
            self.db.commit()
            self.db.refresh(match)

            return self._build_match_detail(match)

        except HTTPException:
            self.db.rollback()
            raise
        except Exception as exc:
            self.db.rollback()
            self.logger.error(f"Error requesting new times for match {match_id}: {exc}")
            raise HTTPException(status_code=500, detail="Failed to request new times")

    async def cancel_match_by_participant(
        self,
        match_id: int,
        acting_participant_id: Optional[UUID] = None,
    ) -> MatchDetailResponse:
        try:
            match: Match | None = (
                self.db.query(Match)
                .options(joinedload(Match.volunteer), joinedload(Match.match_status))
                .filter(Match.id == match_id, Match.deleted_at.is_(None))
                .first()
            )
            if not match:
                raise HTTPException(404, f"Match {match_id} not found")

            if acting_participant_id and match.participant_id != acting_participant_id:
                raise HTTPException(status_code=403, detail="Cannot modify another participant's match")

            self._clear_confirmed_time(match)
            self._set_match_status(match, "cancelled_by_participant")

            self.db.flush()
            self.db.commit()
            self.db.refresh(match)

            return self._build_match_detail(match)

        except HTTPException:
            self.db.rollback()
            raise
        except Exception as exc:
            self.db.rollback()
            self.logger.error(f"Error cancelling match {match_id} as participant: {exc}")
            raise HTTPException(status_code=500, detail="Failed to cancel match")

    async def cancel_match_by_volunteer(
        self,
        match_id: int,
        acting_volunteer_id: Optional[UUID] = None,
    ) -> MatchDetailResponse:
        try:
            match: Match | None = (
                self.db.query(Match)
                .options(joinedload(Match.volunteer), joinedload(Match.match_status))
                .filter(Match.id == match_id, Match.deleted_at.is_(None))
                .first()
            )
            if not match:
                raise HTTPException(404, f"Match {match_id} not found")

            if acting_volunteer_id and match.volunteer_id != acting_volunteer_id:
                raise HTTPException(status_code=403, detail="Cannot modify another volunteer's match")

            self._clear_confirmed_time(match)
            self._set_match_status(match, "cancelled_by_volunteer")

            self.db.flush()
            self.db.commit()
            self.db.refresh(match)

            return self._build_match_detail(match)

        except HTTPException:
            self.db.rollback()
            raise
        except Exception as exc:
            self.db.rollback()
            self.logger.error(f"Error cancelling match {match_id} as volunteer: {exc}")
            raise HTTPException(status_code=500, detail="Failed to cancel match")

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
                .filter(Match.participant_id == participant_id, Match.deleted_at.is_(None))
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

    async def request_new_volunteers(
        self,
        participant_id: UUID,
        acting_participant_id: Optional[UUID] = None,
    ) -> MatchRequestNewVolunteersResponse:
        try:
            if acting_participant_id and participant_id != acting_participant_id:
                raise HTTPException(status_code=403, detail="Cannot modify another participant's matches")

            matches: List[Match] = (
                self.db.query(Match)
                .options(
                    joinedload(Match.suggested_time_blocks),
                    joinedload(Match.confirmed_time),
                    joinedload(Match.match_status),
                )
                .filter(Match.participant_id == participant_id, Match.deleted_at.is_(None))
                .all()
            )

            deleted_count = 0
            for match in matches:
                status_name = match.match_status.name if match.match_status else None
                if status_name in ACTIVE_MATCH_STATUSES:
                    self._delete_match(match)
                    deleted_count += 1

            self.db.flush()
            self.db.commit()

            return MatchRequestNewVolunteersResponse(deleted_matches=deleted_count)

        except HTTPException:
            self.db.rollback()
            raise
        except Exception as exc:
            self.db.rollback()
            self.logger.error(f"Error requesting new volunteers for participant {participant_id}: {exc}")
            raise HTTPException(status_code=500, detail="Failed to request new volunteers")

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

    def _delete_match(self, match: Match) -> None:
        confirmed_block = match.confirmed_time
        for block in list(match.suggested_time_blocks):
            match.suggested_time_blocks.remove(block)
            self.db.delete(block)

        match.confirmed_time = None
        match.chosen_time_block_id = None
        match.deleted_at = datetime.now(timezone.utc)

        if confirmed_block and confirmed_block not in self.db.deleted:
            self.db.delete(confirmed_block)

    def _set_match_status(self, match: Match, status_name: str) -> None:
        status = self.db.query(MatchStatus).filter_by(name=status_name).first()
        if not status:
            raise HTTPException(500, f"Match status '{status_name}' not configured")
        match.match_status = status

    def _clear_confirmed_time(self, match: Match) -> None:
        if not match.confirmed_time:
            return

        confirmed_block = match.confirmed_time
        match.confirmed_time = None
        match.chosen_time_block_id = None

        if confirmed_block in match.suggested_time_blocks:
            match.suggested_time_blocks.remove(confirmed_block)

        if confirmed_block not in self.db.deleted:
            self.db.delete(confirmed_block)

    def _attach_initial_suggested_times(self, match: Match, volunteer: User) -> None:
        if not volunteer.availability:
            return

        now = datetime.now(timezone.utc)
        sorted_blocks = sorted(
            volunteer.availability,
            key=lambda tb: tb.start_time or now,
        )

        for block in sorted_blocks:
            if block.start_time is None:
                continue
            if block.start_time < now:
                continue
            if block.start_time.minute not in {0, 30}:
                continue

            new_block = TimeBlock(start_time=block.start_time)
            match.suggested_time_blocks.append(new_block)
