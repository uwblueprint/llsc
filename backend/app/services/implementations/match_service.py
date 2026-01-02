import logging
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional
from uuid import UUID
from zoneinfo import ZoneInfo

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models import AvailabilityTemplate, Match, MatchStatus, TimeBlock, User
from app.models.UserData import UserData
from app.schemas.match import (
    MatchCreateRequest,
    MatchCreateResponse,
    MatchDetailForVolunteerResponse,
    MatchDetailResponse,
    MatchListForVolunteerResponse,
    MatchListResponse,
    MatchParticipantSummary,
    MatchRequestNewVolunteersResponse,
    MatchResponse,
    MatchUpdateRequest,
    MatchVolunteerSummary,
)
from app.schemas.time_block import TimeBlockEntity, TimeRange
from app.schemas.user import UserRole
from app.utilities.ses_email_service import SESEmailService
from app.utilities.timezone_utils import get_timezone_from_abbreviation

SCHEDULE_CLEANUP_STATUSES = {
    "pending",
    "requesting_new_times",
    "requesting_new_volunteers",
    "awaiting_volunteer_acceptance",
}
ACTIVE_MATCH_STATUSES = {
    "pending",
    "requesting_new_times",
    "requesting_new_volunteers",
    "confirmed",
    "awaiting_volunteer_acceptance",
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

            # Default to awaiting_volunteer_acceptance (volunteers must accept before participants see matches)
            status_name = req.match_status or "awaiting_volunteer_acceptance"
            status = self.db.query(MatchStatus).filter_by(name=status_name).first()
            if not status:
                raise HTTPException(400, f"Invalid match status: {status_name}")

            created_matches: List[Match] = []
            created_visible_match = False

            for volunteer_id in req.volunteer_ids:
                volunteer: User | None = (
                    self.db.query(User).options(joinedload(User.user_data)).filter(User.id == volunteer_id).first()
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

                if status_name != "awaiting_volunteer_acceptance":
                    self._attach_initial_suggested_times(match, volunteer)
                    created_visible_match = True

                created_matches.append(match)

            # Clear pending volunteer request flag if at least one match is visible to the participant
            if created_visible_match:
                participant.pending_volunteer_request = False

            self.db.flush()
            self.db.commit()

            for match in created_matches:
                self.db.refresh(match)

            # Send "matches available" email to each volunteer
            ses_service = SESEmailService()
            for match in created_matches:
                try:
                    volunteer = self.db.get(User, match.volunteer_id)
                    if volunteer and volunteer.email:
                        # Get volunteer's language (enum values are already "en" or "fr")
                        language = volunteer.language.value if volunteer.language else "en"

                        first_name = volunteer.first_name if volunteer.first_name else None
                        matches_url = "http://localhost:3000/volunteer/dashboard"

                        ses_service.send_matches_available_email(
                            to_email=volunteer.email,
                            first_name=first_name,
                            matches_url=matches_url,
                            language=language,
                        )
                except Exception as e:
                    # Log error but don't fail the match creation
                    self.logger.error(f"Failed to send matches available email to volunteer {match.volunteer_id}: {e}")

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

            volunteer_changed = False
            if req.volunteer_id is not None and req.volunteer_id != match.volunteer_id:
                volunteer: User | None = (
                    self.db.query(User).options(joinedload(User.user_data)).filter(User.id == req.volunteer_id).first()
                )
                if not volunteer:
                    raise HTTPException(404, f"Volunteer {req.volunteer_id} not found")
                if volunteer.role is None or volunteer.role.name != UserRole.VOLUNTEER:
                    raise HTTPException(400, "Match volunteers must have volunteer role")
                self._reassign_volunteer(match, volunteer)
                volunteer_changed = True

            if req.match_status is not None:
                status = self.db.query(MatchStatus).filter_by(name=req.match_status).first()
                if not status:
                    raise HTTPException(400, f"Invalid match status: {req.match_status}")
                match.match_status = status
            elif volunteer_changed:
                awaiting_status = self.db.query(MatchStatus).filter_by(name="awaiting_volunteer_acceptance").first()
                if not awaiting_status:
                    raise HTTPException(500, "Match status 'awaiting_volunteer_acceptance' not configured")
                match.match_status = awaiting_status

            if req.chosen_time_block_id is not None:
                block = self.db.get(TimeBlock, req.chosen_time_block_id)
                if not block:
                    raise HTTPException(404, f"TimeBlock {req.chosen_time_block_id} not found")
                match.chosen_time_block_id = block.id
                match.confirmed_time = block
            elif req.clear_chosen_time:
                match.chosen_time_block_id = None
                match.confirmed_time = None

            final_status_name = match.match_status.name if match.match_status else None
            if final_status_name != "awaiting_volunteer_acceptance" and not match.suggested_time_blocks:
                volunteer_with_availability: User | None = (
                    self.db.query(User)
                    .options(joinedload(User.user_data))
                    .filter(User.id == match.volunteer_id)
                    .first()
                )
                if volunteer_with_availability:
                    self._attach_initial_suggested_times(match, volunteer_with_availability)

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

            # Send "call scheduled" email to both participant and volunteer
            try:
                # Load participant and volunteer with their data
                participant = (
                    self.db.query(User)
                    .options(joinedload(User.user_data))
                    .filter(User.id == match.participant_id)
                    .first()
                )
                volunteer = (
                    self.db.query(User)
                    .options(joinedload(User.user_data))
                    .filter(User.id == match.volunteer_id)
                    .first()
                )

                if participant and volunteer and match.confirmed_time:
                    ses_service = SESEmailService()
                    confirmed_time_utc = match.confirmed_time.start_time

                    # Get participant's timezone and language
                    participant_tz = ZoneInfo("America/Toronto")  # Default to EST
                    if participant.user_data and participant.user_data.timezone:
                        tz_result = get_timezone_from_abbreviation(participant.user_data.timezone)
                        if tz_result:
                            participant_tz = tz_result

                    participant_language = participant.language.value if participant.language else "en"

                    # Get volunteer's timezone and language
                    volunteer_tz = ZoneInfo("America/Toronto")  # Default to EST
                    if volunteer.user_data and volunteer.user_data.timezone:
                        tz_result = get_timezone_from_abbreviation(volunteer.user_data.timezone)
                        if tz_result:
                            volunteer_tz = tz_result

                    volunteer_language = volunteer.language.value if volunteer.language else "en"

                    # Convert time to participant's timezone
                    participant_time = confirmed_time_utc.astimezone(participant_tz)
                    participant_date = participant_time.strftime("%B %d, %Y")
                    participant_time_str = participant_time.strftime("%I:%M %p")
                    participant_tz_abbr = participant_time.strftime("%Z")

                    # Convert time to volunteer's timezone
                    volunteer_time = confirmed_time_utc.astimezone(volunteer_tz)
                    volunteer_date = volunteer_time.strftime("%B %d, %Y")
                    volunteer_time_str = volunteer_time.strftime("%I:%M %p")
                    volunteer_tz_abbr = volunteer_time.strftime("%Z")

                    # Send to participant
                    if participant.email:
                        ses_service.send_call_scheduled_email(
                            to_email=participant.email,
                            match_name=f"{volunteer.first_name} {volunteer.last_name}"
                            if volunteer.first_name and volunteer.last_name
                            else "Your volunteer",
                            date=participant_date,
                            time=participant_time_str,
                            timezone=participant_tz_abbr,
                            first_name=participant.first_name,
                            scheduled_calls_url="http://localhost:3000/participant/dashboard",
                            language=participant_language,
                        )

                    # Send to volunteer
                    if volunteer.email:
                        ses_service.send_call_scheduled_email(
                            to_email=volunteer.email,
                            match_name=f"{participant.first_name} {participant.last_name}"
                            if participant.first_name and participant.last_name
                            else "Your participant",
                            date=volunteer_date,
                            time=volunteer_time_str,
                            timezone=volunteer_tz_abbr,
                            first_name=volunteer.first_name,
                            scheduled_calls_url="http://localhost:3000/volunteer/dashboard",
                            language=volunteer_language,
                        )

            except Exception as e:
                # Log error but don't fail the scheduling
                self.logger.error(f"Failed to send call scheduled emails for match {match_id}: {e}")

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

            # Send "participant requested new times" email to volunteer
            try:
                # Load participant and volunteer
                participant = self.db.get(User, match.participant_id)
                volunteer = self.db.get(User, match.volunteer_id)

                if participant and volunteer and volunteer.email:
                    # Get volunteer's language
                    volunteer_language = volunteer.language.value if volunteer.language else "en"

                    # Get participant's name for email
                    participant_name = (
                        f"{participant.first_name} {participant.last_name}"
                        if participant.first_name and participant.last_name
                        else "A participant"
                    )

                    ses_service = SESEmailService()
                    ses_service.send_participant_requested_new_times_email(
                        to_email=volunteer.email,
                        participant_name=participant_name,
                        first_name=volunteer.first_name,
                        matches_url="http://localhost:3000/volunteer/dashboard",
                        language=volunteer_language,
                    )
            except Exception as e:
                # Log error but don't fail the request
                self.logger.error(f"Failed to send participant requested new times email for match {match_id}: {e}")

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

            self._set_match_status(match, "cancelled_by_participant")

            # Send cancellation email to volunteer before deleting match
            try:
                # Load volunteer with their data before deleting match
                volunteer = (
                    self.db.query(User)
                    .options(joinedload(User.user_data))
                    .filter(User.id == match.volunteer_id)
                    .first()
                )
                participant = (
                    self.db.query(User)
                    .options(joinedload(User.user_data))
                    .filter(User.id == match.participant_id)
                    .first()
                )

                if volunteer and participant and match.confirmed_time:
                    ses_service = SESEmailService()
                    confirmed_time_utc = match.confirmed_time.start_time

                    # Get volunteer's timezone and language
                    volunteer_tz = ZoneInfo("America/Toronto")  # Default to EST
                    if volunteer.user_data and volunteer.user_data.timezone:
                        tz_result = get_timezone_from_abbreviation(volunteer.user_data.timezone)
                        if tz_result:
                            volunteer_tz = tz_result

                    volunteer_language = volunteer.language.value if volunteer.language else "en"

                    # Convert time to volunteer's timezone
                    volunteer_time = confirmed_time_utc.astimezone(volunteer_tz)
                    volunteer_date = volunteer_time.strftime("%B %d, %Y")
                    volunteer_time_str = volunteer_time.strftime("%I:%M %p")
                    volunteer_tz_abbr = volunteer_time.strftime("%Z")

                    # Send to volunteer
                    if volunteer.email:
                        participant_name = (
                            f"{participant.first_name} {participant.last_name}"
                            if participant.first_name and participant.last_name
                            else participant.first_name or "The participant"
                        )
                        ses_service.send_participant_cancelled_email(
                            to_email=volunteer.email,
                            participant_name=participant_name,
                            date=volunteer_date,
                            time=volunteer_time_str,
                            timezone=volunteer_tz_abbr,
                            first_name=volunteer.first_name,
                            dashboard_url="http://localhost:3000/volunteer/dashboard",
                            language=volunteer_language,
                        )
            except Exception as e:
                # Log error but don't fail the cancellation
                self.logger.error(f"Failed to send participant cancelled email for match {match_id}: {e}")

            # Soft-delete the match when cancelled (cleans up time blocks and sets deleted_at)
            self._delete_match(match)

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

            # Send cancellation email to participant before clearing confirmed time
            try:
                # Load participant and volunteer with their data before clearing time
                participant = (
                    self.db.query(User)
                    .options(joinedload(User.user_data))
                    .filter(User.id == match.participant_id)
                    .first()
                )
                volunteer = (
                    self.db.query(User)
                    .options(joinedload(User.user_data))
                    .filter(User.id == match.volunteer_id)
                    .first()
                )

                if participant and volunteer and match.confirmed_time:
                    ses_service = SESEmailService()
                    confirmed_time_utc = match.confirmed_time.start_time

                    # Get participant's timezone and language
                    participant_tz = ZoneInfo("America/Toronto")  # Default to EST
                    if participant.user_data and participant.user_data.timezone:
                        tz_result = get_timezone_from_abbreviation(participant.user_data.timezone)
                        if tz_result:
                            participant_tz = tz_result

                    participant_language = participant.language.value if participant.language else "en"

                    # Convert time to participant's timezone
                    participant_time = confirmed_time_utc.astimezone(participant_tz)
                    participant_date = participant_time.strftime("%B %d, %Y")
                    participant_time_str = participant_time.strftime("%I:%M %p")
                    participant_tz_abbr = participant_time.strftime("%Z")

                    # Send to participant
                    if participant.email:
                        volunteer_name = (
                            f"{volunteer.first_name} {volunteer.last_name}"
                            if volunteer.first_name and volunteer.last_name
                            else volunteer.first_name or "Your volunteer"
                        )
                        ses_service.send_volunteer_cancelled_email(
                            to_email=participant.email,
                            volunteer_name=volunteer_name,
                            date=participant_date,
                            time=participant_time_str,
                            timezone=participant_tz_abbr,
                            first_name=participant.first_name,
                            request_matches_url="http://localhost:3000/participant/dashboard",
                            language=participant_language,
                        )
            except Exception as e:
                # Log error but don't fail the cancellation
                self.logger.error(f"Failed to send volunteer cancelled email for match {match_id}: {e}")

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
            # Get participant to check pending request flag
            participant: User | None = self.db.get(User, participant_id)
            if not participant:
                raise HTTPException(404, f"Participant {participant_id} not found")

            # Get matches excluding those awaiting volunteer acceptance (participants shouldn't see these yet)
            matches: List[Match] = (
                self.db.query(Match)
                .options(
                    joinedload(Match.volunteer).joinedload(User.user_data).joinedload(UserData.treatments),
                    joinedload(Match.volunteer).joinedload(User.user_data).joinedload(UserData.experiences),
                    joinedload(Match.volunteer).joinedload(User.user_data).joinedload(UserData.loved_one_treatments),
                    joinedload(Match.volunteer).joinedload(User.user_data).joinedload(UserData.loved_one_experiences),
                    joinedload(Match.volunteer).joinedload(User.volunteer_data),
                    joinedload(Match.match_status),
                    joinedload(Match.suggested_time_blocks),
                    joinedload(Match.confirmed_time),
                )
                .filter(
                    Match.participant_id == participant_id,
                    Match.deleted_at.is_(None),
                    ~Match.match_status.has(MatchStatus.name == "awaiting_volunteer_acceptance"),
                )
                .order_by(Match.created_at.desc())
                .all()
            )

            responses = [self._build_match_detail(match) for match in matches]
            return MatchListResponse(
                matches=responses,
                has_pending_request=participant.pending_volunteer_request or False,
            )
        except HTTPException:
            raise
        except Exception as exc:
            self.logger.error(f"Error fetching matches for participant {participant_id}: {exc}")
            raise HTTPException(status_code=500, detail="Failed to fetch matches")

    async def get_all_matches_for_participant_admin(self, participant_id: UUID) -> MatchListResponse:
        """Get all matches for a participant including those awaiting volunteer acceptance (admin only)."""
        try:
            # Get participant to check pending request flag
            participant: User | None = self.db.get(User, participant_id)
            if not participant:
                raise HTTPException(404, f"Participant {participant_id} not found")

            # Get ALL matches including those awaiting volunteer acceptance
            matches: List[Match] = (
                self.db.query(Match)
                .options(
                    joinedload(Match.volunteer).joinedload(User.user_data).joinedload(UserData.treatments),
                    joinedload(Match.volunteer).joinedload(User.user_data).joinedload(UserData.experiences),
                    joinedload(Match.volunteer).joinedload(User.user_data).joinedload(UserData.loved_one_treatments),
                    joinedload(Match.volunteer).joinedload(User.user_data).joinedload(UserData.loved_one_experiences),
                    joinedload(Match.volunteer).joinedload(User.volunteer_data),
                    joinedload(Match.match_status),
                    joinedload(Match.suggested_time_blocks),
                    joinedload(Match.confirmed_time),
                )
                .filter(
                    Match.participant_id == participant_id,
                    Match.deleted_at.is_(None),
                )
                .order_by(Match.created_at.desc())
                .all()
            )

            responses = [self._build_match_detail(match) for match in matches]
            return MatchListResponse(
                matches=responses,
                has_pending_request=participant.pending_volunteer_request or False,
            )
        except HTTPException:
            raise
        except Exception as exc:
            self.logger.error(f"Error fetching all matches for participant {participant_id}: {exc}")
            raise HTTPException(status_code=500, detail="Failed to fetch matches")

    async def get_matches_for_volunteer(self, volunteer_id: UUID) -> MatchListForVolunteerResponse:
        """Get all matches for a volunteer, including those awaiting acceptance."""
        try:
            volunteer: User | None = self.db.get(User, volunteer_id)
            if not volunteer:
                raise HTTPException(404, f"Volunteer {volunteer_id} not found")
            if volunteer.role is None or volunteer.role.name != UserRole.VOLUNTEER:
                raise HTTPException(400, "Selected user is not a volunteer")

            matches: List[Match] = (
                self.db.query(Match)
                .options(
                    joinedload(Match.participant).joinedload(User.user_data).joinedload(UserData.treatments),
                    joinedload(Match.participant).joinedload(User.user_data).joinedload(UserData.experiences),
                    joinedload(Match.participant).joinedload(User.user_data).joinedload(UserData.loved_one_treatments),
                    joinedload(Match.participant).joinedload(User.user_data).joinedload(UserData.loved_one_experiences),
                    joinedload(Match.match_status),
                )
                .filter(Match.volunteer_id == volunteer_id, Match.deleted_at.is_(None))
                .order_by(Match.created_at.desc())
                .all()
            )

            responses = [self._build_match_detail_for_volunteer(match) for match in matches]
            return MatchListForVolunteerResponse(matches=responses)
        except HTTPException:
            raise
        except Exception as exc:
            self.logger.error(f"Error fetching matches for volunteer {volunteer_id}: {exc}")
            raise HTTPException(status_code=500, detail="Failed to fetch matches")

    async def volunteer_accept_match(
        self,
        match_id: int,
        acting_volunteer_id: Optional[UUID] = None,
    ) -> MatchDetailResponse:
        """Volunteer accepts a match and sends their general availability to participant."""
        try:
            match: Match | None = (
                self.db.query(Match)
                .options(
                    joinedload(Match.volunteer).joinedload(User.user_data),
                    joinedload(Match.participant),
                    joinedload(Match.match_status),
                )
                .filter(Match.id == match_id, Match.deleted_at.is_(None))
                .first()
            )
            if not match:
                raise HTTPException(404, f"Match {match_id} not found")

            # Verify volunteer ownership
            if acting_volunteer_id and match.volunteer_id != acting_volunteer_id:
                raise HTTPException(status_code=403, detail="Cannot modify another volunteer's match")

            # Check current status
            if not match.match_status or match.match_status.name != "awaiting_volunteer_acceptance":
                raise HTTPException(
                    400,
                    f"Match is not awaiting volunteer acceptance. Current status: {match.match_status.name if match.match_status else 'unknown'}",
                )

            volunteer = match.volunteer
            if not volunteer:
                raise HTTPException(404, f"Volunteer {match.volunteer_id} not found")

            # Validate that volunteer has availability before accepting
            if not self._has_valid_availability(volunteer):
                raise HTTPException(
                    400,
                    "Cannot accept match: volunteer must have availability set before accepting matches. "
                    "Please add your availability times first.",
                )

            # Clear any existing suggested time blocks (shouldn't exist, but be safe)
            for block in list(match.suggested_time_blocks):
                match.suggested_time_blocks.remove(block)
                self.db.delete(block)

            # Attach volunteer's general availability as suggested times
            self._attach_initial_suggested_times(match, volunteer)

            # Transition status to "pending" so participant can see it
            self._set_match_status(match, "pending")

            # Clear pending volunteer request flag since match is now visible to participant
            participant = match.participant
            if participant and participant.pending_volunteer_request:
                participant.pending_volunteer_request = False

            self.db.flush()
            self.db.commit()
            self.db.refresh(match)

            # Send "matches available" email to participant
            try:
                participant = match.participant
                if participant and participant.email:
                    # Get participant's language (enum values are already "en" or "fr")
                    language = participant.language.value if participant.language else "en"

                    first_name = participant.first_name if participant.first_name else None
                    matches_url = "http://localhost:3000/participant/dashboard"

                    ses_service = SESEmailService()
                    ses_service.send_matches_available_email(
                        to_email=participant.email,
                        first_name=first_name,
                        matches_url=matches_url,
                        language=language,
                    )
            except Exception as e:
                # Log error but don't fail the match acceptance
                self.logger.error(f"Failed to send matches available email to participant {match.participant_id}: {e}")

            # Return match detail for participant view (includes suggested times)
            return self._build_match_detail(match)
        except HTTPException:
            self.db.rollback()
            raise
        except Exception as exc:
            self.db.rollback()
            self.logger.error(f"Error accepting match {match_id} for volunteer: {exc}")
            raise HTTPException(status_code=500, detail="Failed to accept match")

    def _build_match_detail_for_volunteer(self, match: Match) -> MatchDetailForVolunteerResponse:
        """Build match detail response for volunteer view (includes participant info)."""
        participant = match.participant
        if not participant:
            raise HTTPException(500, "Match is missing participant data")

        participant_data = participant.user_data

        pronouns = None
        diagnosis = None
        age: Optional[int] = None
        treatments: List[str] = []
        experiences: List[str] = []
        timezone: Optional[str] = None
        loved_one_diagnosis: Optional[str] = None
        loved_one_treatments: List[str] = []
        loved_one_experiences: List[str] = []

        if participant_data:
            if participant_data.pronouns:
                pronouns = participant_data.pronouns
            diagnosis = participant_data.diagnosis

            if participant_data.date_of_birth:
                age = self._calculate_age(participant_data.date_of_birth)

            if participant_data.treatments:
                treatments = [t.name for t in participant_data.treatments if t and t.name]

            if participant_data.experiences:
                experiences = [e.name for e in participant_data.experiences if e and e.name]

            timezone = participant_data.timezone

            # Add loved one data
            loved_one_diagnosis = participant_data.loved_one_diagnosis
            if participant_data.loved_one_treatments:
                loved_one_treatments = [t.name for t in participant_data.loved_one_treatments if t and t.name]
            if participant_data.loved_one_experiences:
                loved_one_experiences = [e.name for e in participant_data.loved_one_experiences if e and e.name]

        participant_summary = MatchParticipantSummary(
            id=participant.id,
            first_name=participant.first_name,
            last_name=participant.last_name,
            email=participant.email,
            pronouns=pronouns,
            diagnosis=diagnosis,
            age=age,
            treatments=treatments,
            experiences=experiences,
            timezone=timezone,
            loved_one_diagnosis=loved_one_diagnosis,
            loved_one_treatments=loved_one_treatments,
            loved_one_experiences=loved_one_experiences,
        )

        match_status_name = match.match_status.name if match.match_status else ""

        return MatchDetailForVolunteerResponse(
            id=match.id,
            participant_id=match.participant_id,
            volunteer_id=match.volunteer_id,
            participant=participant_summary,
            match_status=match_status_name,
            created_at=match.created_at,
            updated_at=match.updated_at,
        )

    async def request_new_volunteers(
        self,
        participant_id: UUID,
        acting_participant_id: Optional[UUID] = None,
    ) -> MatchRequestNewVolunteersResponse:
        try:
            if acting_participant_id and participant_id != acting_participant_id:
                raise HTTPException(status_code=403, detail="Cannot modify another participant's matches")

            # Get participant and set pending flag
            participant: User | None = self.db.get(User, participant_id)
            if not participant:
                raise HTTPException(404, f"Participant {participant_id} not found")

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

            # Set pending volunteer request flag
            participant.pending_volunteer_request = True

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

        volunteer_data = volunteer.user_data
        volunteer_data_record = volunteer.volunteer_data

        pronouns = None
        diagnosis = None
        age: Optional[int] = None
        timezone: Optional[str] = None
        phone: Optional[str] = None
        treatments: List[str] = []
        experiences: List[str] = []
        overview: Optional[str] = None
        loved_one_diagnosis: Optional[str] = None
        loved_one_treatments: List[str] = []
        loved_one_experiences: List[str] = []

        if volunteer_data:
            if volunteer_data.pronouns:
                pronouns = volunteer_data.pronouns
            diagnosis = volunteer_data.diagnosis
            timezone = volunteer_data.timezone
            phone = volunteer_data.phone

            if volunteer_data.date_of_birth:
                age = self._calculate_age(volunteer_data.date_of_birth)

            if volunteer_data.treatments:
                treatments = [t.name for t in volunteer_data.treatments if t and t.name]

            if volunteer_data.experiences:
                experiences = [e.name for e in volunteer_data.experiences if e and e.name]

            # Add loved one data
            loved_one_diagnosis = volunteer_data.loved_one_diagnosis
            if volunteer_data.loved_one_treatments:
                loved_one_treatments = [t.name for t in volunteer_data.loved_one_treatments if t and t.name]
            if volunteer_data.loved_one_experiences:
                loved_one_experiences = [e.name for e in volunteer_data.loved_one_experiences if e and e.name]

        # Get overview/experience from volunteer_data table
        if volunteer_data_record and volunteer_data_record.experience:
            overview = volunteer_data_record.experience

        volunteer_summary = MatchVolunteerSummary(
            id=volunteer.id,
            first_name=volunteer.first_name,
            last_name=volunteer.last_name,
            email=volunteer.email,
            phone=phone,
            pronouns=pronouns,
            diagnosis=diagnosis,
            age=age,
            timezone=timezone,
            treatments=treatments,
            experiences=experiences,
            overview=overview,
            loved_one_diagnosis=loved_one_diagnosis,
            loved_one_treatments=loved_one_treatments,
            loved_one_experiences=loved_one_experiences,
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

    @staticmethod
    def _calculate_age(birth_date: date) -> Optional[int]:
        today = date.today()
        if birth_date is None:
            return None
        if birth_date > today:
            return None

        years = today.year - birth_date.year
        has_had_birthday = (today.month, today.day) >= (birth_date.month, birth_date.day)
        return years if has_had_birthday else years - 1

    def _has_valid_availability(self, volunteer: User) -> bool:
        """Check if volunteer has any active availability templates."""
        template_count = self.db.query(AvailabilityTemplate).filter_by(user_id=volunteer.id, is_active=True).count()

        return template_count > 0

    def _attach_initial_suggested_times(self, match: Match, volunteer: User) -> None:
        """
        Projects volunteer's availability templates onto the next 2 weeks
        and creates TimeBlocks for the match's suggested times.

        Template times are interpreted in the volunteer's local timezone,
        then converted to UTC for storage.
        """
        now = datetime.now(timezone.utc)

        # Get active availability templates for this volunteer
        templates = self.db.query(AvailabilityTemplate).filter_by(user_id=volunteer.id, is_active=True).all()

        if not templates:
            return

        # Get volunteer's timezone from user_data
        volunteer_tz: Optional[ZoneInfo] = None
        if volunteer.user_data and volunteer.user_data.timezone:
            volunteer_tz = get_timezone_from_abbreviation(volunteer.user_data.timezone)

        # Default to UTC if no timezone is set (shouldn't happen in production, but handle gracefully)
        if not volunteer_tz:
            self.logger.warning(
                f"Volunteer {volunteer.id} has no timezone set. Interpreting availability templates as UTC."
            )
            volunteer_tz = timezone.utc

        # Project templates 8 days ahead (1 week + 1 day) to ensure we capture at least one future
        # occurrence of each template day, even if today's times have already passed
        projection_days = 8

        for day_offset in range(projection_days):
            # Calculate target date in UTC
            target_date_utc = now + timedelta(days=day_offset)

            # Convert UTC date to volunteer's local date to get the correct weekday
            # Templates are defined in the volunteer's local timezone, so we must
            # compare against the local weekday, not the UTC weekday
            target_date_local = target_date_utc.astimezone(volunteer_tz).date()
            target_day_of_week = target_date_local.weekday()  # 0=Mon, 6=Sun (in volunteer's timezone)

            # Find templates that match this day of week
            for template in templates:
                if template.day_of_week == target_day_of_week:
                    # Create datetime in volunteer's local timezone
                    current_time_local = datetime.combine(target_date_local, template.start_time).replace(
                        tzinfo=volunteer_tz
                    )

                    end_time_local = datetime.combine(target_date_local, template.end_time).replace(tzinfo=volunteer_tz)

                    # Convert to UTC for storage
                    current_time_utc = current_time_local.astimezone(timezone.utc)
                    end_time_utc = end_time_local.astimezone(timezone.utc)

                    while current_time_utc < end_time_utc:
                        # Ensure we don't add blocks in the past
                        if current_time_utc >= now:
                            new_block = TimeBlock(start_time=current_time_utc)
                            match.suggested_time_blocks.append(new_block)

                        current_time_utc += timedelta(minutes=30)

    def _reassign_volunteer(self, match: Match, volunteer: User) -> None:
        match.volunteer_id = volunteer.id

        # Clear confirmed selection
        self._clear_confirmed_time(match)

        # Remove existing suggested blocks
        for block in list(match.suggested_time_blocks):
            match.suggested_time_blocks.remove(block)
            self.db.delete(block)

        # Suggested times are attached once the volunteer accepts the match
