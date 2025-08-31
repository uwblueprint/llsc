import logging
import uuid as uuid_module
from datetime import datetime
from typing import Any, Dict, Tuple

from sqlalchemy.orm import Session

from app.models import Experience, Treatment, UserData, User

logger = logging.getLogger(__name__)


class IntakeFormProcessor:
    """
    Processes intake form JSON submissions into structured database tables.
    Handles both predefined options and custom "Other" entries.
    """

    def __init__(self, db: Session):
        """Initialize the processor with a database session."""
        self.db = db

    def process_form_submission(self, user_id: str, form_data: Dict[str, Any]) -> UserData:
        """
        Process a form submission and create/update UserData.

        Args:
            user_id: UUID string of the user
            form_data: Dictionary containing form submission data

        Returns:
            UserData: The created or updated UserData object

        Raises:
            ValueError: For invalid UUIDs, dates, or other validation errors
            KeyError: For missing required fields
        """
        try:
            # Validate required fields first
            self._validate_required_fields(form_data)

            # Get or create UserData
            user_data, is_new = self._get_or_create_user_data(user_id)

            # Add to session early to avoid relationship warnings
            if is_new:
                self.db.add(user_data)
                self.db.flush()  # Get ID assigned before processing relationships

            # Process different sections of the form
            self._process_personal_info(user_data, form_data.get("personal_info", {}))
            self._process_demographics(user_data, form_data.get("demographics", {}))
            self._process_cancer_experience(user_data, form_data.get("cancer_experience", {}))
            self._process_flow_control(user_data, form_data)

            # Process treatments and experiences (many-to-many)
            cancer_exp = form_data.get("cancer_experience", {})
            self._process_treatments(user_data, cancer_exp)
            self._process_experiences(user_data, cancer_exp)

            # Process caregiver experience for volunteers (separate from cancer experience)
            if "caregiver_experience" in form_data:
                self._process_caregiver_experience(user_data, form_data.get("caregiver_experience", {}))

            # Process loved one data if present
            if "loved_one" in form_data:
                self._process_loved_one_data(user_data, form_data.get("loved_one", {}))

            # Fallback: ensure email is set from the authenticated User if not provided in form
            if not user_data.email:
                owning_user = self.db.query(User).filter(User.id == user_data.user_id).first()
                if owning_user and owning_user.email:
                    user_data.email = owning_user.email

            # Commit all changes
            self.db.commit()
            self.db.refresh(user_data)

            logger.info(f"Successfully processed intake form for user {user_id}")
            return user_data

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error processing intake form for user {user_id}: {str(e)}")
            raise

    def _get_or_create_user_data(self, user_id: str) -> Tuple[UserData, bool]:
        """Get existing UserData or create new one. Returns (user_data, is_new)."""
        # Convert string UUID to UUID object if needed
        if isinstance(user_id, str):
            try:
                user_uuid = uuid_module.UUID(user_id)
            except ValueError:
                raise ValueError(f"Invalid UUID format: {user_id}")
        else:
            user_uuid = user_id

        # Look for existing UserData by user_id foreign key
        user_data = self.db.query(UserData).filter(UserData.user_id == user_uuid).first()
        if not user_data:
            user_data = UserData(user_id=user_uuid)
            return user_data, True  # New object
        return user_data, False  # Existing object

    def _validate_required_fields(self, form_data: Dict[str, Any]):
        """Validate that required fields are present."""
        personal_info = form_data.get("personal_info")
        if not personal_info:
            raise KeyError("personal_info section is required")

        required_fields = [
            "first_name",
            "last_name",
            "date_of_birth",
            "phone_number",
            "city",
            "province",
            "postal_code",
        ]

        for key in required_fields:
            if key not in personal_info:
                raise KeyError(f"Required field missing: personal_info.{key}")

    def _trim_text(self, text: str) -> str:
        """Trim whitespace from text fields."""
        if isinstance(text, str):
            return text.strip()
        return text

    def _parse_date(self, date_str: str):
        """Parse date string with strict validation."""
        if not date_str:
            return None

        # Try DD/MM/YYYY format first (frontend format)
        try:
            return datetime.strptime(date_str, "%d/%m/%Y").date()
        except ValueError:
            pass

        # Try ISO format as fallback
        try:
            return datetime.fromisoformat(date_str).date()
        except ValueError:
            raise ValueError(f"Invalid date format: {date_str}. Expected DD/MM/YYYY or ISO format.")

    def _process_personal_info(self, user_data: UserData, personal_info: Dict[str, Any]):
        """Process personal information fields."""
        user_data.first_name = self._trim_text(personal_info.get("first_name"))
        user_data.last_name = self._trim_text(personal_info.get("last_name"))
        user_data.email = self._trim_text(personal_info.get("email"))
        user_data.phone = self._trim_text(personal_info.get("phone_number"))
        user_data.city = self._trim_text(personal_info.get("city"))
        user_data.province = self._trim_text(personal_info.get("province"))
        user_data.postal_code = self._trim_text(personal_info.get("postal_code"))

        # Parse date of birth with strict validation
        if "date_of_birth" in personal_info:
            try:
                user_data.date_of_birth = self._parse_date(personal_info.get("date_of_birth"))
            except ValueError:
                raise ValueError(f"Invalid date format for dateOfBirth: {personal_info.get('date_of_birth')}")

    def _process_demographics(self, user_data: UserData, demographics: Dict[str, Any]):
        """Process demographic information."""
        user_data.gender_identity = self._trim_text(demographics.get("gender_identity"))
        user_data.pronouns = demographics.get("pronouns", [])
        user_data.ethnic_group = demographics.get("ethnic_group", [])
        user_data.marital_status = self._trim_text(demographics.get("marital_status"))
        user_data.has_kids = demographics.get("has_kids")
        user_data.other_ethnic_group = self._trim_text(demographics.get("ethnic_group_custom"))
        user_data.gender_identity_custom = self._trim_text(demographics.get("gender_identity_custom"))

    def _process_cancer_experience(self, user_data: UserData, cancer_experience: Dict[str, Any]):
        """Process cancer experience information."""
        user_data.diagnosis = self._trim_text(cancer_experience.get("diagnosis"))
        user_data.other_treatment = self._trim_text(cancer_experience.get("other_treatment"))
        user_data.other_experience = self._trim_text(cancer_experience.get("other_experience"))

        # Parse diagnosis date with strict validation
        if "date_of_diagnosis" in cancer_experience:
            try:
                user_data.date_of_diagnosis = self._parse_date(cancer_experience.get("date_of_diagnosis"))
            except ValueError:
                raise ValueError(
                    f"Invalid date format for dateOfDiagnosis: {cancer_experience.get('date_of_diagnosis')}"
                )

    def _process_flow_control(self, user_data: UserData, form_data: Dict[str, Any]):
        """Process flow control fields."""
        user_data.has_blood_cancer = form_data.get("has_blood_cancer")
        user_data.caring_for_someone = form_data.get("caring_for_someone")

    def _process_treatments(self, user_data: UserData, cancer_exp: Dict[str, Any]):
        """
        Process treatments - map frontend names to database records.
        Handles both predefined options and creates new ones for custom entries.
        """
        treatment_names = cancer_exp.get("treatments", [])
        if not treatment_names:
            return

        # Clear existing treatments
        user_data.treatments.clear()

        for treatment_name in treatment_names:
            if not treatment_name:
                continue

            # Find existing treatment
            treatment = self.db.query(Treatment).filter(Treatment.name == treatment_name).first()

            if treatment:
                user_data.treatments.append(treatment)
            else:
                # Create new treatment for custom entry
                logger.info(f"Creating new treatment: {treatment_name}")
                new_treatment = Treatment(name=treatment_name)
                self.db.add(new_treatment)
                self.db.flush()  # Get the ID
                user_data.treatments.append(new_treatment)

    def _process_experiences(self, user_data: UserData, cancer_exp: Dict[str, Any]):
        """
        Process experiences - map frontend names to database records.
        Handles both predefined options and creates new ones for custom entries.
        """
        experience_names = cancer_exp.get("experiences", [])
        if not experience_names:
            return

        # Clear existing experiences
        user_data.experiences.clear()

        for experience_name in experience_names:
            if not experience_name:
                continue

            # Find existing experience
            experience = self.db.query(Experience).filter(Experience.name == experience_name).first()

            if experience:
                user_data.experiences.append(experience)
            else:
                # Create new experience for custom entry
                logger.info(f"Creating new experience: {experience_name}")
                new_experience = Experience(name=experience_name)
                self.db.add(new_experience)
                self.db.flush()  # Get the ID
                user_data.experiences.append(new_experience)

    def _process_caregiver_experience(self, user_data: UserData, caregiver_exp: Dict[str, Any]):
        """
        Process caregiver experience for volunteers who are caregivers without cancer.
        Maps caregiver experiences to the same user_experiences table as cancer experiences.
        """
        if not caregiver_exp:
            return

        # Handle "Other" caregiver experience text
        user_data.other_experience = caregiver_exp.get("other_experience")

        # Process caregiver experiences - map to same experiences table
        experience_names = caregiver_exp.get("experiences", [])
        if not experience_names:
            return

        # Note: We don't clear existing experiences here in case user has both
        # cancer and caregiver experiences (though that would be in cancerExperience)

        for experience_name in experience_names:
            if not experience_name:
                continue

            # Find existing experience
            experience = self.db.query(Experience).filter(Experience.name == experience_name).first()

            if experience:
                # Only add if not already present
                if experience not in user_data.experiences:
                    user_data.experiences.append(experience)
            else:
                # Create new experience for custom entry
                logger.info(f"Creating new caregiver experience: {experience_name}")
                new_experience = Experience(name=experience_name)
                self.db.add(new_experience)
                self.db.flush()  # Get the ID
                user_data.experiences.append(new_experience)

    def _process_loved_one_data(self, user_data: UserData, loved_one_data: Dict[str, Any]):
        """Process loved one data including demographics and cancer experience."""
        if not loved_one_data:
            return

        # Process loved one demographics
        self._process_loved_one_demographics(user_data, loved_one_data.get("demographics", {}))

        # Process loved one cancer experience
        self._process_loved_one_cancer_experience(user_data, loved_one_data.get("cancer_experience", {}))

        # Process loved one treatments and experiences
        self._process_loved_one_treatments(user_data, loved_one_data.get("cancer_experience", {}))
        self._process_loved_one_experiences(user_data, loved_one_data.get("cancer_experience", {}))

    def _process_loved_one_demographics(self, user_data: UserData, demographics: Dict[str, Any]):
        """Process loved one demographic information."""
        if not demographics:
            return

        user_data.loved_one_gender_identity = demographics.get("gender_identity")
        user_data.loved_one_age = demographics.get("age")

    def _process_loved_one_cancer_experience(self, user_data: UserData, cancer_exp: Dict[str, Any]):
        """Process loved one cancer experience information."""
        if not cancer_exp:
            return

        user_data.loved_one_diagnosis = self._trim_text(cancer_exp.get("diagnosis"))

        # Parse loved one diagnosis date with strict validation
        if "date_of_diagnosis" in cancer_exp:
            try:
                user_data.loved_one_date_of_diagnosis = self._parse_date(cancer_exp.get("date_of_diagnosis"))
            except ValueError:
                raise ValueError(
                    f"Invalid date format for loved one dateOfDiagnosis: {cancer_exp.get('date_of_diagnosis')}"
                )

        # Handle "Other" treatment and experience text for loved one with trimming
        user_data.loved_one_other_treatment = self._trim_text(cancer_exp.get("other_treatment"))
        user_data.loved_one_other_experience = self._trim_text(cancer_exp.get("other_experience"))

    def _process_loved_one_treatments(self, user_data: UserData, cancer_exp: Dict[str, Any]):
        """Process loved one treatments - map frontend names to database records."""
        treatment_names = cancer_exp.get("treatments", [])
        if not treatment_names:
            return

        # Clear existing loved one treatments
        user_data.loved_one_treatments.clear()

        for treatment_name in treatment_names:
            if not treatment_name:
                continue

            # Find existing treatment
            treatment = self.db.query(Treatment).filter(Treatment.name == treatment_name).first()

            if treatment:
                user_data.loved_one_treatments.append(treatment)
            else:
                # Create new treatment for custom entry
                logger.info(f"Creating new loved one treatment: {treatment_name}")
                new_treatment = Treatment(name=treatment_name)
                self.db.add(new_treatment)
                self.db.flush()  # Get the ID
                user_data.loved_one_treatments.append(new_treatment)

    def _process_loved_one_experiences(self, user_data: UserData, cancer_exp: Dict[str, Any]):
        """Process loved one experiences - map frontend names to database records."""
        experience_names = cancer_exp.get("experiences", [])
        if not experience_names:
            return

        # Clear existing loved one experiences
        user_data.loved_one_experiences.clear()

        for experience_name in experience_names:
            if not experience_name:
                continue

            # Find existing experience
            experience = self.db.query(Experience).filter(Experience.name == experience_name).first()

            if experience:
                user_data.loved_one_experiences.append(experience)
            else:
                # Create new experience for custom entry
                logger.info(f"Creating new loved one experience: {experience_name}")
                new_experience = Experience(name=experience_name)
                self.db.add(new_experience)
                self.db.flush()  # Get the ID
                user_data.loved_one_experiences.append(new_experience)

    def process_ranking_form(self, user_id: str, ranking_data: Dict[str, Any]):
        """
        Process ranking form submission for user preferences.

        Args:
            user_id: The user's UUID
            ranking_data: The ranking preferences data
        """
        # TODO: Implement ranking preferences processing
        # This would handle RankingPreference model population
        pass
