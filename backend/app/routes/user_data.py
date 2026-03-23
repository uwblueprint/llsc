"""Routes for accessing user data (UserData table)."""

from datetime import datetime as dt
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session, joinedload

from app.middleware.auth import has_roles
from app.models import Experience, Task, TaskType, Treatment, User, UserData
from app.models.User import Language
from app.models.VolunteerData import VolunteerData
from app.schemas.user import UserRole
from app.utilities.db_utils import get_db

router = APIRouter(
    prefix="/user-data",
    tags=["user-data"],
)


# ===== Schemas =====


class TreatmentResponse(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)


class ExperienceResponse(BaseModel):
    id: int
    name: str
    scope: str
    model_config = ConfigDict(from_attributes=True)


class AvailabilityTemplateResponse(BaseModel):
    """Response schema for availability template"""

    day_of_week: int  # 0=Monday, 1=Tuesday, ..., 6=Sunday
    start_time: str  # Time string in format "HH:MM:SS"
    end_time: str  # Time string in format "HH:MM:SS"
    model_config = ConfigDict(from_attributes=True)


class UserDataResponse(BaseModel):
    """Response schema for UserData with all relationships resolved"""

    # Personal Information
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    postal_code: Optional[str] = None

    # Demographics
    gender_identity: Optional[str] = None
    pronouns: Optional[List[str]] = None
    ethnic_group: Optional[List[str]] = None
    marital_status: Optional[str] = None
    has_kids: Optional[str] = None
    other_ethnic_group: Optional[str] = None
    gender_identity_custom: Optional[str] = None
    timezone: Optional[str] = None

    # Cancer Experience
    diagnosis: Optional[str] = None
    date_of_diagnosis: Optional[str] = None
    treatments: List[str] = []
    experiences: List[str] = []

    # Loved One Information
    loved_one_gender_identity: Optional[str] = None
    loved_one_age: Optional[str] = None
    loved_one_diagnosis: Optional[str] = None
    loved_one_date_of_diagnosis: Optional[str] = None
    loved_one_treatments: List[str] = []
    loved_one_experiences: List[str] = []

    # Flow Control
    has_blood_cancer: Optional[bool] = None
    caring_for_someone: Optional[bool] = None

    # Availability (list of availability templates)
    availability: List[AvailabilityTemplateResponse] = []

    # Volunteer Data (for volunteers)
    volunteer_experience: Optional[str] = None


# ===== Endpoints =====


# ===== Endpoints =====


@router.get("/me", response_model=UserDataResponse)
async def get_my_user_data(
    request: Request,
    db: Session = Depends(get_db),
    authorized: bool = has_roles([UserRole.PARTICIPANT, UserRole.VOLUNTEER, UserRole.ADMIN]),
):
    """
    Get the current user's UserData with all relationships resolved.

    Returns all fields from UserData including:
    - Personal information
    - Demographics
    - Cancer experience with treatments and experiences
    - Loved one information with treatments and experiences
    """
    try:
        # Get current user from auth middleware
        current_user_auth_id = request.state.user_id
        current_user = (
            db.query(User).options(joinedload(User.volunteer_data)).filter(User.auth_id == current_user_auth_id).first()
        )

        if not current_user:
            raise HTTPException(status_code=401, detail="User not found")

        # Get UserData for current user
        user_data = db.query(UserData).filter(UserData.user_id == current_user.id).first()

        if not user_data:
            raise HTTPException(status_code=404, detail="User data not found")

        # Get Availability templates for current user (only active ones)
        availability_templates = [
            AvailabilityTemplateResponse(
                day_of_week=template.day_of_week,
                start_time=template.start_time.isoformat(),
                end_time=template.end_time.isoformat(),
            )
            for template in current_user.availability_templates
            if template.is_active
        ]

        # Get volunteer_data.experience if user is a volunteer
        volunteer_experience = None
        if current_user.volunteer_data:
            volunteer_experience = current_user.volunteer_data.experience

        # Build response with all fields and resolved relationships
        response = UserDataResponse(
            # Personal Information
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            email=user_data.email,
            phone=user_data.phone,
            date_of_birth=user_data.date_of_birth.isoformat() if user_data.date_of_birth else None,
            city=user_data.city,
            province=user_data.province,
            postal_code=user_data.postal_code,
            # Demographics
            gender_identity=user_data.gender_identity,
            pronouns=user_data.pronouns,
            ethnic_group=user_data.ethnic_group,
            marital_status=user_data.marital_status,
            has_kids=user_data.has_kids,
            other_ethnic_group=user_data.other_ethnic_group,
            gender_identity_custom=user_data.gender_identity_custom,
            timezone=user_data.timezone,
            # Cancer Experience
            diagnosis=user_data.diagnosis,
            date_of_diagnosis=user_data.date_of_diagnosis.isoformat() if user_data.date_of_diagnosis else None,
            treatments=[treatment.name for treatment in user_data.treatments],
            experiences=[experience.name for experience in user_data.experiences],
            # Loved One Information
            loved_one_gender_identity=user_data.loved_one_gender_identity,
            loved_one_age=user_data.loved_one_age,
            loved_one_diagnosis=user_data.loved_one_diagnosis,
            loved_one_date_of_diagnosis=(
                user_data.loved_one_date_of_diagnosis.isoformat() if user_data.loved_one_date_of_diagnosis else None
            ),
            loved_one_treatments=[treatment.name for treatment in user_data.loved_one_treatments],
            loved_one_experiences=[experience.name for experience in user_data.loved_one_experiences],
            # Flow Control
            has_blood_cancer=user_data.has_blood_cancer,
            caring_for_someone=user_data.caring_for_someone,
            # Availability
            availability=availability_templates,
            # Volunteer Data
            volunteer_experience=volunteer_experience,
        )

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/me", response_model=UserDataResponse)
async def update_my_user_data(
    update_data: dict,
    request: Request,
    db: Session = Depends(get_db),
    authorized: bool = has_roles([UserRole.PARTICIPANT, UserRole.VOLUNTEER, UserRole.ADMIN]),
):
    """
    Update the current user's UserData.

    Accepts a partial update - only provided fields will be updated.
    Handles both simple fields and many-to-many relationships (treatments, experiences).
    """
    try:
        # Get current user from auth middleware
        current_user_auth_id = request.state.user_id
        current_user = (
            db.query(User).options(joinedload(User.volunteer_data)).filter(User.auth_id == current_user_auth_id).first()
        )

        if not current_user:
            raise HTTPException(status_code=401, detail="User not found")

        # Get UserData for current user
        user_data = db.query(UserData).filter(UserData.user_id == current_user.id).first()

        if not user_data:
            raise HTTPException(status_code=404, detail="User data not found")

        # Capture old values for task description (before any updates)
        old_values = {}
        # Store simple fields
        for field in [
            "first_name",
            "last_name",
            "email",
            "phone",
            "city",
            "province",
            "postal_code",
            "gender_identity",
            "marital_status",
            "has_kids",
            "other_ethnic_group",
            "gender_identity_custom",
            "diagnosis",
            "loved_one_gender_identity",
            "loved_one_age",
            "loved_one_diagnosis",
            "has_blood_cancer",
            "caring_for_someone",
            "pronouns",
            "ethnic_group",
            "date_of_birth",
            "date_of_diagnosis",
            "loved_one_date_of_diagnosis",
            "timezone",
        ]:
            old_values[field] = getattr(user_data, field, None)

        # Store treatments/experiences
        old_values["treatments"] = [t.name for t in user_data.treatments]
        old_values["experiences"] = [e.name for e in user_data.experiences]
        old_values["loved_one_treatments"] = [t.name for t in user_data.loved_one_treatments]
        old_values["loved_one_experiences"] = [e.name for e in user_data.loved_one_experiences]

        # Store language from User model
        old_values["language"] = current_user.language.value if current_user.language else None

        # Store volunteer_experience
        volunteer_data = db.query(VolunteerData).filter(VolunteerData.user_id == current_user.id).first()
        old_values["volunteer_experience"] = volunteer_data.experience if volunteer_data else None

        # Update simple fields
        simple_fields = [
            "first_name",
            "last_name",
            "email",
            "phone",
            "city",
            "province",
            "postal_code",
            "gender_identity",
            "marital_status",
            "has_kids",
            "other_ethnic_group",
            "gender_identity_custom",
            "diagnosis",
            "loved_one_gender_identity",
            "loved_one_age",
            "loved_one_diagnosis",
            "has_blood_cancer",
            "caring_for_someone",
        ]

        for field in simple_fields:
            if field in update_data:
                setattr(user_data, field, update_data[field])

        # Update array fields
        array_fields = ["pronouns", "ethnic_group"]
        for field in array_fields:
            if field in update_data:
                setattr(user_data, field, update_data[field])

        # Update date fields
        if "date_of_birth" in update_data and update_data["date_of_birth"]:
            try:
                user_data.date_of_birth = dt.fromisoformat(update_data["date_of_birth"]).date()
            except (ValueError, AttributeError):
                # Try parsing DD/MM/YYYY format
                try:
                    user_data.date_of_birth = dt.strptime(update_data["date_of_birth"], "%d/%m/%Y").date()
                except ValueError:
                    pass

        if "date_of_diagnosis" in update_data and update_data["date_of_diagnosis"]:
            try:
                user_data.date_of_diagnosis = dt.fromisoformat(update_data["date_of_diagnosis"]).date()
            except (ValueError, AttributeError):
                try:
                    user_data.date_of_diagnosis = dt.strptime(update_data["date_of_diagnosis"], "%d/%m/%Y").date()
                except ValueError:
                    pass

        if "loved_one_date_of_diagnosis" in update_data and update_data["loved_one_date_of_diagnosis"]:
            try:
                user_data.loved_one_date_of_diagnosis = dt.fromisoformat(
                    update_data["loved_one_date_of_diagnosis"]
                ).date()
            except (ValueError, AttributeError):
                try:
                    user_data.loved_one_date_of_diagnosis = dt.strptime(
                        update_data["loved_one_date_of_diagnosis"], "%d/%m/%Y"
                    ).date()
                except ValueError:
                    pass

        # Update treatments (many-to-many)
        if "treatments" in update_data:
            user_data.treatments.clear()
            for treatment_name in update_data["treatments"]:
                treatment = db.query(Treatment).filter(Treatment.name == treatment_name).first()
                if treatment:
                    user_data.treatments.append(treatment)

        # Update experiences (many-to-many)
        if "experiences" in update_data:
            user_data.experiences.clear()
            for experience_name in update_data["experiences"]:
                experience = db.query(Experience).filter(Experience.name == experience_name).first()
                if experience:
                    user_data.experiences.append(experience)

        # Update loved one treatments
        if "loved_one_treatments" in update_data:
            user_data.loved_one_treatments.clear()
            for treatment_name in update_data["loved_one_treatments"]:
                treatment = db.query(Treatment).filter(Treatment.name == treatment_name).first()
                if treatment:
                    user_data.loved_one_treatments.append(treatment)

        # Update loved one experiences
        if "loved_one_experiences" in update_data:
            user_data.loved_one_experiences.clear()
            for experience_name in update_data["loved_one_experiences"]:
                experience = db.query(Experience).filter(Experience.name == experience_name).first()
                if experience:
                    user_data.loved_one_experiences.append(experience)

        # Update user language (stored on User model, not UserData)
        if "language" in update_data:
            try:
                language_value = update_data["language"]
                if language_value in ["en", "fr"]:
                    current_user.language = Language(language_value)
            except (ValueError, AttributeError):
                pass  # Invalid language value, skip

        # Update user timezone (stored on UserData model)
        if "timezone" in update_data:
            user_data.timezone = update_data["timezone"]

        # Handle volunteer_experience update if provided
        if "volunteer_experience" in update_data:
            volunteer_data = db.query(VolunteerData).filter(VolunteerData.user_id == current_user.id).first()
            if volunteer_data:
                volunteer_data.experience = update_data["volunteer_experience"]
            else:
                # Create volunteer_data if it doesn't exist
                volunteer_data = VolunteerData(
                    user_id=current_user.id,
                    experience=update_data["volunteer_experience"],
                )
                db.add(volunteer_data)

        # Commit the main profile update first
        db.commit()
        db.refresh(user_data)

        # Create PROFILE_UPDATE task if user is not an admin (after main commit to avoid rollback)
        if current_user.role and current_user.role.name != "admin":
            try:
                changes = []

                # Compare simple fields
                for field in update_data:
                    if field in [
                        "first_name",
                        "last_name",
                        "email",
                        "phone",
                        "city",
                        "province",
                        "postal_code",
                        "gender_identity",
                        "marital_status",
                        "has_kids",
                        "other_ethnic_group",
                        "gender_identity_custom",
                        "diagnosis",
                        "loved_one_gender_identity",
                        "loved_one_age",
                        "loved_one_diagnosis",
                        "has_blood_cancer",
                        "caring_for_someone",
                        "timezone",
                    ]:
                        new_value = getattr(user_data, field, None)
                        old_value = old_values.get(field)
                        if new_value != old_value:
                            changes.append(f"{field}: '{old_value}' → '{new_value}'")

                    # Compare array fields
                    elif field in ["pronouns", "ethnic_group"]:
                        new_value = getattr(user_data, field, [])
                        old_value = old_values.get(field, [])
                        if new_value != old_value:
                            changes.append(f"{field}: {old_value} → {new_value}")

                    # Compare date fields
                    elif field in ["date_of_birth", "date_of_diagnosis", "loved_one_date_of_diagnosis"]:
                        new_value = getattr(user_data, field, None)
                        old_value = old_values.get(field)
                        if new_value != old_value:
                            new_str = new_value.isoformat() if new_value else None
                            old_str = old_value.isoformat() if old_value else None
                            changes.append(f"{field}: '{old_str}' → '{new_str}'")

                    # Compare treatments/experiences
                    elif field == "treatments":
                        new_value = [t.name for t in user_data.treatments]
                        old_value = old_values.get("treatments", [])
                        if sorted(new_value) != sorted(old_value):
                            changes.append(f"treatments: {old_value} → {new_value}")

                    elif field == "experiences":
                        new_value = [e.name for e in user_data.experiences]
                        old_value = old_values.get("experiences", [])
                        if sorted(new_value) != sorted(old_value):
                            changes.append(f"experiences: {old_value} → {new_value}")

                    elif field == "loved_one_treatments":
                        new_value = [t.name for t in user_data.loved_one_treatments]
                        old_value = old_values.get("loved_one_treatments", [])
                        if sorted(new_value) != sorted(old_value):
                            changes.append(f"loved_one_treatments: {old_value} → {new_value}")

                    elif field == "loved_one_experiences":
                        new_value = [e.name for e in user_data.loved_one_experiences]
                        old_value = old_values.get("loved_one_experiences", [])
                        if sorted(new_value) != sorted(old_value):
                            changes.append(f"loved_one_experiences: {old_value} → {new_value}")

                    # Compare language
                    elif field == "language":
                        new_value = current_user.language.value if current_user.language else None
                        old_value = old_values.get("language")
                        if new_value != old_value:
                            changes.append(f"language: '{old_value}' → '{new_value}'")

                    # Compare volunteer_experience
                    elif field == "volunteer_experience":
                        volunteer_data_check = (
                            db.query(VolunteerData).filter(VolunteerData.user_id == current_user.id).first()
                        )
                        new_value = volunteer_data_check.experience if volunteer_data_check else None
                        old_value = old_values.get("volunteer_experience")
                        if new_value != old_value:
                            changes.append(f"volunteer_experience: '{old_value}' → '{new_value}'")

                # Only create task if there are actual changes
                if changes:
                    user_name = f"{user_data.first_name} {user_data.last_name}".strip() or user_data.email
                    description = f"{user_name} updated profile: " + ", ".join(changes)

                    profile_task = Task(
                        participant_id=current_user.id,
                        type=TaskType.PROFILE_UPDATE,
                        description=description,
                    )
                    db.add(profile_task)
                    # Commit task creation in isolated try/except to prevent rollback of profile update
                    db.commit()
            except Exception as e:
                # Log error but don't fail the request - profile update already committed
                db.rollback()  # Rollback only the task creation attempt
                print(f"Failed to create PROFILE_UPDATE task: {str(e)}")

        # Return updated data using the same logic as GET
        availability_templates = [
            AvailabilityTemplateResponse(
                day_of_week=template.day_of_week,
                start_time=template.start_time.isoformat(),
                end_time=template.end_time.isoformat(),
            )
            for template in current_user.availability_templates
            if template.is_active
        ]

        # Get volunteer_data.experience if user is a volunteer
        volunteer_experience = None
        if current_user.volunteer_data:
            volunteer_experience = current_user.volunteer_data.experience

        response = UserDataResponse(
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            email=user_data.email,
            phone=user_data.phone,
            date_of_birth=user_data.date_of_birth.isoformat() if user_data.date_of_birth else None,
            city=user_data.city,
            province=user_data.province,
            postal_code=user_data.postal_code,
            gender_identity=user_data.gender_identity,
            pronouns=user_data.pronouns,
            ethnic_group=user_data.ethnic_group,
            marital_status=user_data.marital_status,
            has_kids=user_data.has_kids,
            other_ethnic_group=user_data.other_ethnic_group,
            gender_identity_custom=user_data.gender_identity_custom,
            timezone=user_data.timezone,
            diagnosis=user_data.diagnosis,
            date_of_diagnosis=user_data.date_of_diagnosis.isoformat() if user_data.date_of_diagnosis else None,
            treatments=[treatment.name for treatment in user_data.treatments],
            experiences=[experience.name for experience in user_data.experiences],
            loved_one_gender_identity=user_data.loved_one_gender_identity,
            loved_one_age=user_data.loved_one_age,
            loved_one_diagnosis=user_data.loved_one_diagnosis,
            loved_one_date_of_diagnosis=(
                user_data.loved_one_date_of_diagnosis.isoformat() if user_data.loved_one_date_of_diagnosis else None
            ),
            loved_one_treatments=[treatment.name for treatment in user_data.loved_one_treatments],
            loved_one_experiences=[experience.name for experience in user_data.loved_one_experiences],
            has_blood_cancer=user_data.has_blood_cancer,
            caring_for_someone=user_data.caring_for_someone,
            availability=availability_templates,
            volunteer_experience=volunteer_experience,
        )

        return response

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ===== Admin Endpoints =====


class AdminUserDataResponse(BaseModel):
    """Detailed response for admin lookups."""

    id: str
    user_id: str
    first_name: str | None
    last_name: str | None
    date_of_birth: str | None
    email: str | None
    phone: str | None
    city: str | None
    province: str | None
    postal_code: str | None
    gender_identity: str | None
    pronouns: List[str] | None
    ethnic_group: List[str] | None
    marital_status: str | None
    has_kids: str | None
    diagnosis: str | None
    date_of_diagnosis: str | None
    other_ethnic_group: str | None
    gender_identity_custom: str | None
    has_blood_cancer: str | None
    caring_for_someone: str | None
    loved_one_gender_identity: str | None
    loved_one_age: str | None
    loved_one_diagnosis: str | None
    loved_one_date_of_diagnosis: str | None
    treatments: List[TreatmentResponse] = []
    experiences: List[ExperienceResponse] = []
    loved_one_treatments: List[TreatmentResponse] = []
    loved_one_experiences: List[ExperienceResponse] = []

    model_config = ConfigDict(from_attributes=True)


@router.get("/{user_id}", response_model=AdminUserDataResponse | None)
async def get_user_data(
    user_id: str,
    db: Session = Depends(get_db),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    """Get UserData for a specific user (admin only)."""
    try:
        user_uuid = UUID(user_id)
        user_data = (
            db.query(UserData)
            .options(
                joinedload(UserData.treatments),
                joinedload(UserData.experiences),
                joinedload(UserData.loved_one_treatments),
                joinedload(UserData.loved_one_experiences),
            )
            .filter(UserData.user_id == user_uuid)
            .first()
        )

        if not user_data:
            return None

        return AdminUserDataResponse(
            id=str(user_data.id),
            user_id=str(user_data.user_id),
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            date_of_birth=user_data.date_of_birth.isoformat() if user_data.date_of_birth else None,
            email=user_data.email,
            phone=user_data.phone,
            city=user_data.city,
            province=user_data.province,
            postal_code=user_data.postal_code,
            gender_identity=user_data.gender_identity,
            pronouns=user_data.pronouns,
            ethnic_group=user_data.ethnic_group,
            marital_status=user_data.marital_status,
            has_kids=user_data.has_kids,
            diagnosis=user_data.diagnosis,
            date_of_diagnosis=user_data.date_of_diagnosis.isoformat() if user_data.date_of_diagnosis else None,
            other_ethnic_group=user_data.other_ethnic_group,
            gender_identity_custom=user_data.gender_identity_custom,
            has_blood_cancer=user_data.has_blood_cancer,
            caring_for_someone=user_data.caring_for_someone,
            loved_one_gender_identity=user_data.loved_one_gender_identity,
            loved_one_age=user_data.loved_one_age,
            loved_one_diagnosis=user_data.loved_one_diagnosis,
            loved_one_date_of_diagnosis=(
                user_data.loved_one_date_of_diagnosis.isoformat() if user_data.loved_one_date_of_diagnosis else None
            ),
            treatments=[TreatmentResponse.model_validate(t) for t in (user_data.treatments or [])],
            experiences=[ExperienceResponse.model_validate(e) for e in (user_data.experiences or [])],
            loved_one_treatments=[TreatmentResponse.model_validate(t) for t in (user_data.loved_one_treatments or [])],
            loved_one_experiences=[
                ExperienceResponse.model_validate(e) for e in (user_data.loved_one_experiences or [])
            ],
        )

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid user ID format: {exc}") from exc
    except Exception as exc:  # pragma: no cover - unexpected errors
        print(f"Error in get_user_data: {type(exc).__name__}: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))
