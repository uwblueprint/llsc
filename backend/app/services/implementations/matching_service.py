import logging
import math
from datetime import date
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.interfaces.matching_service import IMatchingService
from app.models.Experience import Experience
from app.models.Quality import Quality
from app.models.RankingPreference import RankingPreference
from app.models.Role import Role
from app.models.Treatment import Treatment
from app.models.User import User
from app.models.UserData import UserData
from app.schemas.user import UserBase, UserRole


class MatchingService(IMatchingService):
    def __init__(self, db: Session):
        self.db = db
        self.logger = logging.getLogger(__name__)

    async def get_matches(self, participant_id: UUID, limit: Optional[int] = 5) -> List[Dict[str, Any]]:
        """
        Find potential volunteer matches for a participant using complex ranking preferences.
        :param participant_id: ID of the participant user to find matches for
        :param limit: Maximum number of matches to return (default 5)
        :return: List of dictionaries with 'user' and 'score' keys
        :raises ValueError: If user is not found or not a participant
        """
        try:
            # Get the participant user
            user = self.db.query(User).filter(User.id == participant_id).first()
            if not user:
                raise ValueError(f"User with ID {participant_id} not found")

            # Verify this is a participant
            if user.role.name != UserRole.PARTICIPANT:
                raise ValueError(f"User with ID {participant_id} is not a participant")

            # Get participant's UserData
            participant_data = self.db.query(UserData).filter(UserData.user_id == participant_id).first()
            if not participant_data:
                raise ValueError(f"User with ID {participant_id} has no intake form data")

            # Get participant's ranking preferences
            participant_preferences = self._get_user_preferences(participant_id)
            if not participant_preferences:
                raise ValueError(f"User with ID {participant_id} has no ranking form data")

            # Get all active, approved volunteers with their data
            volunteers_with_data = (
                self.db.query(User, UserData)
                .join(User.role)
                .join(UserData, User.id == UserData.user_id)
                .filter(Role.name == UserRole.VOLUNTEER)
                .filter(User.active)
                .filter(User.approved)
                .all()
            )

            if not volunteers_with_data:
                return []

            # Calculate scores for each volunteer
            scored_volunteers = []
            for volunteer_user, volunteer_data in volunteers_with_data:
                # print(f"\n=== COMPARING: Participant vs {volunteer_user.first_name} {volunteer_user.last_name} ===")
                # self._print_comparison_table(participant_data, volunteer_data, volunteer_user.first_name + " " + volunteer_user.last_name, participant_preferences)
                score = self._calculate_match_score(participant_data, volunteer_data, participant_preferences)
                # print(f"FINAL SCORE: {score}")
                scored_volunteers.append((volunteer_user, score))

            # Sort by score (highest first) and apply limit
            scored_volunteers.sort(key=lambda x: x[1], reverse=True)
            if limit:
                scored_volunteers = scored_volunteers[:limit]


            # Convert to response models with scores
            return [
                {
                    'user': UserBase(
                        first_name=volunteer.first_name,
                        last_name=volunteer.last_name,
                        email=volunteer.email,
                        role=UserRole(volunteer.role.name)
                    ),
                    'score': score
                }
                for volunteer, score in scored_volunteers
            ]

        except ValueError as ve:
            raise ve
        except Exception as e:
            self.logger.error(f"Error finding matches: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Internal server error during matching process: {str(e)}")

    def _get_user_preferences(self, user_id: UUID) -> List[Dict[str, Any]]:
        """Get user's ranking preferences with full context."""
        preferences = (
            self.db.query(RankingPreference)
            .filter(RankingPreference.user_id == user_id)
            .order_by(RankingPreference.rank)
            .all()
        )

        preference_data = []
        for pref in preferences:
            pref_info = {
                'target_role': pref.target_role,
                'kind': pref.kind,
                'scope': pref.scope,
                'rank': pref.rank,
                'object': None
            }

            # Get the actual object based on kind
            if pref.kind == 'quality' and pref.quality_id:
                quality = self.db.query(Quality).filter(Quality.id == pref.quality_id).first()
                pref_info['object'] = quality
            elif pref.kind == 'treatment' and pref.treatment_id:
                treatment = self.db.query(Treatment).filter(Treatment.id == pref.treatment_id).first()
                pref_info['object'] = treatment
            elif pref.kind == 'experience' and pref.experience_id:
                experience = self.db.query(Experience).filter(Experience.id == pref.experience_id).first()
                pref_info['object'] = experience

            if pref_info['object']:
                preference_data.append(pref_info)

        return preference_data

    def _calculate_match_score(self, participant_data: UserData, volunteer_data: UserData, preferences: List[Dict[str, Any]]) -> float:
        """
        Calculate match score using complex preference system with target roles, kinds, and scopes.
        """

        # Group preferences by target role
        patient_prefs = [p for p in preferences if p['target_role'] == 'patient']
        caregiver_prefs = [p for p in preferences if p['target_role'] == 'caregiver']

        # Check user conditions directly
        has_cancer = (participant_data.has_blood_cancer or "").lower() == "yes"
        is_caregiver = (participant_data.caring_for_someone or "").lower() == "yes"
        wants_patient = has_cancer and not is_caregiver

        # Case 1: Participant (patient) wants cancer patient volunteer
        if patient_prefs and wants_patient:
            return self._score_preferences(patient_prefs, participant_data, volunteer_data,
                                          "self", "self")

        # Case 2: Participant (caregiver) wants ONLY cancer patient volunteers
        # Match caregiver's loved one data with volunteer's patient data
        if patient_prefs and is_caregiver and not caregiver_prefs:
            return self._score_preferences(patient_prefs, participant_data, volunteer_data,
                                          "loved_one", "self")

        # Case 3: Participant (caregiver) wants caregiver volunteers
        # Match based on both patient and caregiver qualities
        if caregiver_prefs and is_caregiver and not patient_prefs:
            return self._score_preferences(caregiver_prefs, participant_data, volunteer_data,
                                          "self", "self") + self._score_preferences(patient_prefs, participant_data, volunteer_data,
                                          "loved_one", "loved_one")

        return 0.0

    def _print_comparison_table(self, participant_data: UserData, volunteer_data: UserData, volunteer_name: str, preferences: List[Dict[str, Any]]) -> None:
        """Print a side-by-side comparison table of participant vs volunteer data with preference indicators."""

        print(f"{'Field':<25} | {'Participant':<30} | {volunteer_name:<30}")
        print("-" * 90)

        # Extract preference information for marking
        preference_fields = set()
        for pref in preferences:
            obj = pref.get('object')
            kind = pref.get('kind')
            if obj and kind == 'quality':
                preference_fields.add(obj.slug)
            elif obj and kind == 'treatment':
                preference_fields.add(f"treatment_{obj.name}")
            elif obj and kind == 'experience':
                preference_fields.add(f"experience_{obj.name}")

        # Key matching fields
        fields = [
            ("Gender", participant_data.gender_identity, volunteer_data.gender_identity),
            ("Diagnosis", participant_data.diagnosis, volunteer_data.diagnosis),
            ("Date of Birth", str(participant_data.date_of_birth), str(volunteer_data.date_of_birth)),
            ("Marital Status", participant_data.marital_status, volunteer_data.marital_status),
            ("Has Kids", participant_data.has_kids, volunteer_data.has_kids),
            ("City", participant_data.city, volunteer_data.city),
            ("Province", participant_data.province, volunteer_data.province),
            ("Has Blood Cancer", participant_data.has_blood_cancer, volunteer_data.has_blood_cancer),
            ("Caring for Someone", participant_data.caring_for_someone, volunteer_data.caring_for_someone),
        ]

        # Add loved one fields if participant is caregiver
        if (participant_data.caring_for_someone or "").lower() == "yes":
            fields.append(("--- LOVED ONE DATA ---", "Participant Loved One", "Volunteer Loved One"))
            loved_one_fields = [
                ("LO Gender", participant_data.loved_one_gender_identity, volunteer_data.loved_one_gender_identity),
                ("LO Age", participant_data.loved_one_age, volunteer_data.loved_one_age),
                ("LO Diagnosis", participant_data.loved_one_diagnosis, volunteer_data.loved_one_diagnosis),
                ("LO Date Diagnosis", str(participant_data.loved_one_date_of_diagnosis), str(volunteer_data.loved_one_date_of_diagnosis)),
            ]
            fields.extend(loved_one_fields)

        for field_name, participant_val, volunteer_val in fields:
            participant_str = str(participant_val) if participant_val is not None else "None"
            volunteer_str = str(volunteer_val) if volunteer_val is not None else "None"

            # Check if this field is a preference
            is_preference = False
            if field_name == "Gender" and "same_gender_identity" in preference_fields:
                is_preference = True
            elif field_name == "Diagnosis" and "same_diagnosis" in preference_fields:
                is_preference = True
            elif field_name == "Date of Birth" and "same_age" in preference_fields:
                is_preference = True
            elif field_name == "Marital Status" and "same_marital_status" in preference_fields:
                is_preference = True
            elif field_name == "Has Kids" and "same_parental_status" in preference_fields:
                is_preference = True

            # Indicators
            pref_indicator = " *PREF*" if is_preference else ""
            match_indicator = " *MATCH*" if participant_val == volunteer_val and participant_val is not None else ""

            print(f"{field_name:<25} | {participant_str:<30} | {volunteer_str:<30}{pref_indicator}{match_indicator}")

    def _userdata_to_dict(self, user_data: UserData) -> dict:
        """Convert UserData object to dictionary for JSON serialization."""

        def serialize_value(value):
            if isinstance(value, date):
                return value.isoformat()
            elif value is None:
                return None
            else:
                return str(value)

        return {
            "gender_identity": serialize_value(user_data.gender_identity),
            "diagnosis": serialize_value(user_data.diagnosis),
            "date_of_birth": serialize_value(user_data.date_of_birth),
            "date_of_diagnosis": serialize_value(user_data.date_of_diagnosis),
            "marital_status": serialize_value(user_data.marital_status),
            "has_kids": serialize_value(user_data.has_kids),
            "has_blood_cancer": serialize_value(user_data.has_blood_cancer),
            "caring_for_someone": serialize_value(user_data.caring_for_someone),
            "city": serialize_value(user_data.city),
            "province": serialize_value(user_data.province),
            "loved_one_gender_identity": serialize_value(user_data.loved_one_gender_identity),
            "loved_one_age": serialize_value(user_data.loved_one_age),
            "loved_one_diagnosis": serialize_value(user_data.loved_one_diagnosis),
            "loved_one_date_of_diagnosis": serialize_value(user_data.loved_one_date_of_diagnosis),
        }

    def _score_preferences(self, preferences: List[Dict[str, Any]], participant_data: UserData, volunteer_data: UserData,
                          participant_scope: str, volunteer_scope: str) -> float:
        """Score preferences with explicit participant and volunteer scopes."""
        if not preferences:
            return 0.0

        total_score = 0.0
        max_possible_score = 0.0

        for pref in preferences:
            # Calculate preference weight (higher rank = lower weight)
            rank = pref['rank']
            weight = 1.0 / rank  # Simple inverse ranking

            # Check if volunteer matches this preference using explicit scopes
            match_score = self._check_preference_match(
                participant_data, volunteer_data, pref, participant_scope, volunteer_scope
            )

            # Handle both boolean and float returns
            if isinstance(match_score, bool):
                match_score = 1.0 if match_score else 0.0

            total_score += weight * match_score

            max_possible_score += weight

        # Return normalized score (0.0 to 1.0)
        return total_score / max_possible_score if max_possible_score > 0 else 0.0


    def _check_preference_match(self, participant_data: UserData, volunteer_data: UserData,
                               preference: Dict[str, Any], participant_scope: str, volunteer_scope: str) -> bool:
        """Check if volunteer matches a preference using explicit scopes for participant and volunteer."""
        obj = preference['object']
        kind = preference['kind']

        if kind == 'quality':
            return self._check_quality_match(participant_data, volunteer_data, obj, participant_scope, volunteer_scope)
        elif kind == 'treatment':
            return self._check_treatment_match(volunteer_data, obj, volunteer_scope)
        elif kind == 'experience':
            return self._check_experience_match(volunteer_data, obj, volunteer_scope)

        return False

    def _check_quality_match(self, participant_data: UserData, volunteer_data: UserData,
                            quality: Quality, participant_scope: str, volunteer_scope: str) -> bool:
        """Check if volunteer matches a quality preference with explicit scopes."""
        quality_slug = quality.slug

        # Get participant value based on participant_scope
        if participant_scope == "self":
            if quality_slug == "same_gender_identity":
                participant_value = participant_data.gender_identity
            elif quality_slug == "same_diagnosis":
                participant_value = participant_data.diagnosis
            elif quality_slug == "same_age":
                if participant_data.date_of_birth:
                    participant_value = date.today().year - participant_data.date_of_birth.year
                else:
                    participant_value = None
            elif quality_slug == "same_marital_status":
                participant_value = participant_data.marital_status
            elif quality_slug == "same_parental_status":
                participant_value = participant_data.has_kids
            else:
                return False
        elif participant_scope == "loved_one":
            if quality_slug == "same_gender_identity":
                participant_value = participant_data.loved_one_gender_identity
            elif quality_slug == "same_diagnosis":
                participant_value = participant_data.loved_one_diagnosis
            elif quality_slug == "same_age":
                participant_value = participant_data.loved_one_age  # This is age range, needs special handling
            else:
                return False
        else:
            return False

        # Get volunteer value based on volunteer_scope
        if volunteer_scope == "self":
            if quality_slug == "same_gender_identity":
                volunteer_value = volunteer_data.gender_identity
            elif quality_slug == "same_diagnosis":
                volunteer_value = volunteer_data.diagnosis
            elif quality_slug == "same_age":
                if volunteer_data.date_of_birth:
                    volunteer_value = date.today().year - volunteer_data.date_of_birth.year
                else:
                    volunteer_value = None
            elif quality_slug == "same_marital_status":
                volunteer_value = volunteer_data.marital_status
            elif quality_slug == "same_parental_status":
                volunteer_value = volunteer_data.has_kids
            else:
                return False
        elif volunteer_scope == "loved_one":
            if quality_slug == "same_gender_identity":
                volunteer_value = volunteer_data.loved_one_gender_identity
            elif quality_slug == "same_diagnosis":
                volunteer_value = volunteer_data.loved_one_diagnosis
            elif quality_slug == "same_age":
                volunteer_value = volunteer_data.loved_one_age  # This is age range, needs special handling
            elif quality_slug == "same_marital_status":
                volunteer_value = None
            elif quality_slug == "same_parental_status":
                volunteer_value = None
            else:
                return False
        else:
            return False

        # Compare values
        if quality_slug == "same_age":
            return self._check_age_similarity(participant_value, volunteer_value)
        else:
            return participant_value == volunteer_value

    def _check_treatment_match(self, volunteer_data: UserData,
                              treatment: Treatment, volunteer_scope: str) -> bool:
        """Check if volunteer has experience with the specific treatment."""
        treatment_name = treatment.name

        # Check if volunteer has experience with this treatment (based on their scope)
        if volunteer_scope == 'self':
            volunteer_treatments = {t.name for t in volunteer_data.treatments}
            return treatment_name in volunteer_treatments
        elif volunteer_scope == 'loved_one':
            volunteer_treatments = {t.name for t in volunteer_data.loved_one_treatments}
            return treatment_name in volunteer_treatments

        return False

    def _check_experience_match(self, volunteer_data: UserData,
                               experience: Experience, volunteer_scope: str) -> bool:
        """Check if volunteer has experience with the specific experience."""
        experience_name = experience.name

        # Check if volunteer has experience with this (based on their scope)
        if volunteer_scope == 'self':
            volunteer_experiences = {e.name for e in volunteer_data.experiences}
            return experience_name in volunteer_experiences
        elif volunteer_scope == 'loved_one':
            volunteer_loved_experiences = {e.name for e in volunteer_data.loved_one_experiences}
            return experience_name in volunteer_loved_experiences

        return False

    def _softmax(self, values: List[float]) -> List[float]:
        """Apply softmax function to convert values to probabilities."""
        if not values:
            return []

        # Subtract max for numerical stability
        max_val = max(values)
        exp_values = [math.exp(v - max_val) for v in values]
        sum_exp = sum(exp_values)

        if sum_exp == 0:
            return [1.0 / len(values)] * len(values)

        return [exp_val / sum_exp for exp_val in exp_values]

    def _check_age_similarity(self, participant_age, volunteer_age) -> float:
        """Calculate age similarity from age values directly."""
        if not participant_age or not volunteer_age:
            return 0.0

        # Convert string ages to integers
        if isinstance(participant_age, str):
            try:
                participant_age = int(participant_age)
            except ValueError:
                return 0.0
        if isinstance(volunteer_age, str):
            try:
                volunteer_age = int(volunteer_age)
            except ValueError:
                return 0.0

        if participant_age <= 0:
            return 0.0

        age_diff = abs(participant_age - volunteer_age)
        similarity_ratio = 1.0 - (age_diff / participant_age)

        # Ensure score is between 0.0 and 1.0
        return max(0.0, min(1.0, similarity_ratio))
