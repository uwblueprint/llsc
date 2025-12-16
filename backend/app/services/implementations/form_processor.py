"""
FormProcessor - Handles processing of form submissions when admin approves them.

This class dispatches to the appropriate processor based on form type:
- intake: IntakeFormProcessor (creates UserData, updates form_status)
- ranking: RankingProcessor (creates RankingPreference records)
- secondary: VolunteerDataProcessor (creates VolunteerData)
- role changes: handles become_participant / become_volunteer transitions
"""

import logging
from typing import Optional

from sqlalchemy import delete, or_
from sqlalchemy.orm import Session

from app.models import (
    AvailabilityTemplate,
    FormSubmission,
    Match,
    RankingPreference,
    Role,
    Task,
    User,
    suggested_times,
)
from app.models.User import FormStatus
from app.services.implementations.intake_form_processor import IntakeFormProcessor
from app.services.implementations.volunteer_data_service import VolunteerDataService
from app.utilities.constants import LOGGER_NAME


class FormProcessor:
    """
    Processes approved form submissions into their respective database tables.
    """

    def __init__(self, db: Session):
        self.db = db
        self.logger = logging.getLogger(LOGGER_NAME("form_processor"))

    def process_approved_submission(self, submission: FormSubmission) -> None:
        """
        Process a form submission that has been approved by an admin.

        Args:
            submission: The FormSubmission to process

        Raises:
            ValueError: If form type is unknown or processing fails
        """
        form_type = submission.form.type
        user = self.db.query(User).filter(User.id == submission.user_id).first()

        if not user:
            raise ValueError(f"User {submission.user_id} not found")

        self.logger.info(f"Processing approved {form_type} form for user {user.id}")

        if form_type == "intake":
            self._process_intake_form(submission, user)
        elif form_type == "ranking":
            self._process_ranking_form(submission, user)
        elif form_type == "secondary":
            self._process_secondary_form(submission, user)
        elif form_type in ("become_participant", "become_volunteer"):
            self._process_role_change_form(submission, user, form_type)
        else:
            raise ValueError(f"Unknown form type: {form_type}")

    def _process_intake_form(self, submission: FormSubmission, user: User) -> None:
        """Process intake form - creates UserData and updates form_status."""
        processor = IntakeFormProcessor(self.db)
        processor.process_form_submission(
            user_id=str(user.id),
            form_data=submission.answers,
        )
        # IntakeFormProcessor updates form_status internally

        # After processing, set next step based on participant/volunteer
        # Determine if this is a participant or volunteer form
        form_name = submission.form.name if submission.form else ""
        is_participant = "Participant" in form_name
        is_volunteer = "Volunteer" in form_name

        # Fallback: check user's role if form name doesn't indicate type
        if not is_participant and not is_volunteer:
            if user.role and user.role.name == "participant":
                is_participant = True
            elif user.role and user.role.name == "volunteer":
                is_volunteer = True

        # Update form_status to next step
        if is_participant:
            user.form_status = FormStatus.RANKING_TODO
        elif is_volunteer:
            user.form_status = FormStatus.SECONDARY_APPLICATION_TODO

    def _process_ranking_form(self, submission: FormSubmission, user: User) -> None:
        """Process ranking form - creates RankingPreference records."""
        answers = submission.answers
        target = answers.get("target")
        preferences = answers.get("preferences", [])

        if not target:
            raise ValueError("Ranking form missing 'target' field")

        # Delete existing preferences for this user/target
        self.db.query(RankingPreference).filter(
            RankingPreference.user_id == user.id,
            RankingPreference.target_role == target,
        ).delete(synchronize_session=False)

        # Create new preference records
        for pref in preferences:
            kind = pref.get("kind")
            item_id = pref.get("id")
            scope = pref.get("scope")
            rank = pref.get("rank")

            ranking_pref = RankingPreference(
                user_id=user.id,
                target_role=target,
                kind=kind,
                quality_id=item_id if kind == "quality" else None,
                treatment_id=item_id if kind == "treatment" else None,
                experience_id=item_id if kind == "experience" else None,
                scope=scope,
                rank=rank,
            )
            self.db.add(ranking_pref)

        # Update form_status to completed after ranking form is approved
        if user.form_status in (FormStatus.RANKING_TODO, FormStatus.RANKING_SUBMITTED):
            user.form_status = FormStatus.COMPLETED

    def _process_secondary_form(self, submission: FormSubmission, user: User) -> None:
        """Process secondary application form - creates VolunteerData."""
        service = VolunteerDataService(self.db)
        service.process_volunteer_data(
            user_id=user.id,
            answers=submission.answers,
        )

        # Update form_status to completed after secondary application is approved
        if user.form_status in (FormStatus.SECONDARY_APPLICATION_TODO, FormStatus.SECONDARY_APPLICATION_SUBMITTED):
            user.form_status = FormStatus.COMPLETED

    def _process_role_change_form(self, submission: FormSubmission, user: User, form_type: str) -> None:
        """
        Process role change forms (become_participant, become_volunteer).
        These may require different handling based on business rules.
        """
        if form_type == "become_participant":
            self._process_become_participant_form(submission, user)
            return

        if form_type == "become_volunteer":
            self._process_become_volunteer_form(submission, user)
            return

        self.logger.info(
            "Role change form (%s) approved for user %s. No custom handler defined.",
            form_type,
            user.id,
        )

    def _process_become_participant_form(self, submission: FormSubmission, user: User) -> None:
        """
        Convert an existing volunteer into a participant by wiping volunteer data,
        removing historical submissions/matches, and re-processing the submission
        through the standard intake pipeline.
        """
        self.logger.info("Converting volunteer %s into participant via role change form", user.id)
        self._cleanup_user_state_for_role_change(user, keep_submission_id=submission.id)

        participant_role = self._get_role_by_name("participant")
        user.role_id = participant_role.id
        user.role = participant_role
        user.pending_volunteer_request = False

        # Reuse the standard intake processor to populate UserData
        intake_processor = IntakeFormProcessor(self.db)
        intake_processor.process_form_submission(user_id=str(user.id), form_data=submission.answers or {})

        user.form_status = FormStatus.RANKING_TODO

    def _process_become_volunteer_form(self, submission: FormSubmission, user: User) -> None:
        """
        Convert an existing participant into a volunteer and mark them ready for the secondary app.
        """
        self.logger.info("Converting participant %s into volunteer via role change form", user.id)
        self._cleanup_user_state_for_role_change(user, keep_submission_id=submission.id)

        volunteer_role = self._get_role_by_name("volunteer")
        user.role_id = volunteer_role.id
        user.role = volunteer_role
        user.pending_volunteer_request = False

        intake_processor = IntakeFormProcessor(self.db)
        intake_processor.process_form_submission(user_id=str(user.id), form_data=submission.answers or {})

        user.form_status = FormStatus.SECONDARY_APPLICATION_TODO

    def _cleanup_user_state_for_role_change(self, user: User, keep_submission_id) -> None:
        """Remove volunteer-specific records so the user can restart as a participant."""
        # Clear ranking preferences
        self.db.query(RankingPreference).filter(RankingPreference.user_id == user.id).delete(synchronize_session=False)

        # Delete matches and their suggested time associations
        matches = self.db.query(Match).filter(or_(Match.participant_id == user.id, Match.volunteer_id == user.id)).all()
        if matches:
            match_ids = [match.id for match in matches]
            self.db.execute(delete(suggested_times).where(suggested_times.c.match_id.in_(match_ids)))
            self.db.flush()
            for match in matches:
                self.db.delete(match)

        # Remove tasks referencing the user (participant or assignee)
        self.db.query(Task).filter(or_(Task.participant_id == user.id, Task.assignee_id == user.id)).delete(
            synchronize_session=False
        )

        # Remove availability + volunteer-only data
        self.db.query(AvailabilityTemplate).filter(AvailabilityTemplate.user_id == user.id).delete(
            synchronize_session=False
        )
        if user.volunteer_data:
            self.db.delete(user.volunteer_data)

        # Remove any prior intake data so we can rebuild it
        if user.user_data:
            user.user_data.treatments.clear()
            user.user_data.experiences.clear()
            user.user_data.loved_one_treatments.clear()
            user.user_data.loved_one_experiences.clear()
            self.db.delete(user.user_data)

        # Delete all historical form submissions except the current role-change request
        self.db.query(FormSubmission).filter(
            FormSubmission.user_id == user.id, FormSubmission.id != keep_submission_id
        ).delete(synchronize_session=False)

        self.db.flush()

    def _get_role_by_name(self, role_name: str) -> Role:
        """Lookup helper to avoid hard-coding role IDs."""
        role: Optional[Role] = self.db.query(Role).filter(Role.name == role_name).first()
        if not role:
            raise ValueError(f"Role '{role_name}' not found in database")
        return role
