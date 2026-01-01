"""Service for automatically completing matches after their scheduled calls."""

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models.Match import Match
from app.models.MatchStatus import MatchStatus
from app.models.TimeBlock import TimeBlock
from app.utilities.constants import LOGGER_NAME
from app.utilities.db_utils import SessionLocal


class MatchCompletionService:
    """Service to automatically complete matches after their scheduled call time."""

    def __init__(self):
        self.logger = logging.getLogger(LOGGER_NAME("match_completion_service"))

    def auto_complete_matches(self) -> None:
        """
        Find all confirmed matches where the scheduled call ended 30+ minutes ago
        and mark them as completed and soft-deleted.

        Uses a set-based UPDATE query for efficiency and atomicity.
        This method is designed to be called periodically by the scheduler.
        It is idempotent - safe to run multiple times without side effects.
        """
        db: Session = SessionLocal()

        try:
            self.logger.info("Starting auto-completion job for matches")

            # Calculate the cutoff time (current time - 30 minutes)
            now = datetime.now(timezone.utc)
            cutoff_time = now - timedelta(minutes=30)

            # Get the "completed" and "confirmed" status IDs
            completed_status = db.query(MatchStatus).filter(MatchStatus.name == "completed").first()
            confirmed_status = db.query(MatchStatus).filter(MatchStatus.name == "confirmed").first()

            if not completed_status or not confirmed_status:
                self.logger.error("Required match statuses not found in database")
                return

            # Build subquery to select qualifying time blocks once
            timeblock_subquery = select(TimeBlock.id).where(TimeBlock.start_time < cutoff_time)

            # Execute set-based UPDATE with returning clause so logging knows which rows changed
            stmt = (
                update(Match)
                .where(
                    Match.deleted_at.is_(None),
                    Match.match_status_id == confirmed_status.id,
                    Match.chosen_time_block_id.isnot(None),
                    Match.chosen_time_block_id.in_(timeblock_subquery),
                )
                .values(match_status_id=completed_status.id, deleted_at=now)
                .returning(Match.id, Match.participant_id, Match.volunteer_id)
            )

            result = db.execute(stmt)
            db.commit()

            completed_matches = result.fetchall()
            if not completed_matches:
                self.logger.info("No matches found that need auto-completion")
                return

            # Log each completed match for audit trail
            for match in completed_matches:
                self.logger.info(
                    f"Auto-completed match {match.id} "
                    f"(participant: {match.participant_id}, volunteer: {match.volunteer_id})"
                )

            self.logger.info(f"Successfully auto-completed {len(completed_matches)} match(es)")

        except Exception as e:
            db.rollback()
            self.logger.error(f"Error in auto_complete_matches job: {str(e)}", exc_info=True)
        finally:
            db.close()
