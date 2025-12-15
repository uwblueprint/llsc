"""
FormProcessor - Handles processing of form submissions when admin approves them.

This class dispatches to the appropriate processor based on form type:
- intake: IntakeFormProcessor (creates UserData, updates form_status)
- ranking: RankingProcessor (creates RankingPreference records)
- secondary: VolunteerDataProcessor (creates VolunteerData)
"""

import logging

from sqlalchemy.orm import Session

from app.models import FormSubmission, User
from app.models.RankingPreference import RankingPreference
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
            # These forms may have different processing logic
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
        # For now, just log that the form was approved
        # Actual role changes might need additional business logic
        self.logger.info(
            f"Role change form ({form_type}) approved for user {user.id}. " "Additional processing may be needed."
        )

        # Mark user as having a pending role change request if needed
        if form_type == "become_volunteer":
            user.pending_volunteer_request = True
        # Additional logic for become_participant can be added here
