"""Routes for accessing user data (UserData table)"""

from datetime import datetime as dt
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session, joinedload

from app.middleware.auth import has_roles
from app.models import Experience, Treatment, User, UserData
from app.schemas.user import UserRole
from app.utilities.db_utils import get_db

router = APIRouter(
    prefix="/user-data",
    tags=["user-data"],
)


class TreatmentResponse(BaseModel):
    """Response model for treatment."""

    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)


class ExperienceResponse(BaseModel):
    """Response model for experience."""

    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)


class AvailabilityTemplateResponse(BaseModel):
    """Response schema for availability template."""

    day_of_week: int  # 0=Monday, 1=Tuesday, ..., 6=Sunday
    start_time: str  # Time string in format "HH:MM:SS"
    end_time: str  # Time string in format "HH:MM:SS"
    model_config = ConfigDict(from_attributes=True)


class UserDataResponse(BaseModel):
    """Response schema for UserData with all relationships resolved."""

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


@router.get("/me", response_model=UserDataResponse)
async def get_my_user_data(
    request: Request,
    db: Session = Depends(get_db),
    authorized: bool = has_roles([UserRole.PARTICIPANT, UserRole.VOLUNTEER, UserRole.ADMIN]),
):
    """Get the current user's UserData with all relationships resolved."""
    try:
        current_user_auth_id = request.state.user_id
        current_user = db.query(User).filter(User.auth_id == current_user_auth_id).first()

        if not current_user:
            raise HTTPException(status_code=401, detail="User not found")

        user_data = db.query(UserData).filter(UserData.user_id == current_user.id).first()

        if not user_data:
            raise HTTPException(status_code=404, detail="User data not found")

        availability_templates = [
            AvailabilityTemplateResponse(
                day_of_week=template.day_of_week,
                start_time=template.start_time.isoformat(),
                end_time=template.end_time.isoformat(),
            )
            for template in current_user.availability_templates
            if template.is_active
        ]

        return UserDataResponse(
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
        )

    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - unexpected errors
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/me", response_model=UserDataResponse)
async def update_my_user_data(
    update_data: dict,
    request: Request,
    db: Session = Depends(get_db),
    authorized: bool = has_roles([UserRole.PARTICIPANT, UserRole.VOLUNTEER, UserRole.ADMIN]),
):
    """Update the current user's UserData."""
    try:
        current_user_auth_id = request.state.user_id
        current_user = db.query(User).filter(User.auth_id == current_user_auth_id).first()

        if not current_user:
            raise HTTPException(status_code=401, detail="User not found")

        user_data = db.query(UserData).filter(UserData.user_id == current_user.id).first()

        if not user_data:
            raise HTTPException(status_code=404, detail="User data not found")

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

        for field in ["pronouns", "ethnic_group"]:
            if field in update_data:
                setattr(user_data, field, update_data[field])

        if update_data.get("date_of_birth"):
            try:
                user_data.date_of_birth = dt.fromisoformat(update_data["date_of_birth"]).date()
            except (ValueError, AttributeError):
                pass

        if update_data.get("date_of_diagnosis"):
            try:
                user_data.date_of_diagnosis = dt.fromisoformat(update_data["date_of_diagnosis"]).date()
            except (ValueError, AttributeError):
                pass

        if update_data.get("loved_one_date_of_diagnosis"):
            try:
                user_data.loved_one_date_of_diagnosis = dt.fromisoformat(
                    update_data["loved_one_date_of_diagnosis"]
                ).date()
            except (ValueError, AttributeError):
                pass

        if "treatments" in update_data:
            user_data.treatments.clear()
            for treatment_name in update_data["treatments"]:
                treatment = db.query(Treatment).filter(Treatment.name == treatment_name).first()
                if treatment:
                    user_data.treatments.append(treatment)

        if "experiences" in update_data:
            user_data.experiences.clear()
            for experience_name in update_data["experiences"]:
                experience = db.query(Experience).filter(Experience.name == experience_name).first()
                if experience:
                    user_data.experiences.append(experience)

        if "loved_one_treatments" in update_data:
            user_data.loved_one_treatments.clear()
            for treatment_name in update_data["loved_one_treatments"]:
                treatment = db.query(Treatment).filter(Treatment.name == treatment_name).first()
                if treatment:
                    user_data.loved_one_treatments.append(treatment)

        if "loved_one_experiences" in update_data:
            user_data.loved_one_experiences.clear()
            for experience_name in update_data["loved_one_experiences"]:
                experience = db.query(Experience).filter(Experience.name == experience_name).first()
                if experience:
                    user_data.loved_one_experiences.append(experience)

        db.commit()
        db.refresh(user_data)

        availability_templates = [
            AvailabilityTemplateResponse(
                day_of_week=template.day_of_week,
                start_time=template.start_time.isoformat(),
                end_time=template.end_time.isoformat(),
            )
            for template in current_user.availability_templates
            if template.is_active
        ]

        return UserDataResponse(
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
        )

    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - unexpected errors
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))


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
            date_of_birth=str(user_data.date_of_birth) if user_data.date_of_birth else None,
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
            date_of_diagnosis=str(user_data.date_of_diagnosis) if user_data.date_of_diagnosis else None,
            other_ethnic_group=user_data.other_ethnic_group,
            gender_identity_custom=user_data.gender_identity_custom,
            has_blood_cancer=user_data.has_blood_cancer,
            caring_for_someone=user_data.caring_for_someone,
            loved_one_gender_identity=user_data.loved_one_gender_identity,
            loved_one_age=user_data.loved_one_age,
            loved_one_diagnosis=user_data.loved_one_diagnosis,
            loved_one_date_of_diagnosis=str(user_data.loved_one_date_of_diagnosis)
            if user_data.loved_one_date_of_diagnosis
            else None,
            treatments=[TreatmentResponse.model_validate(t) for t in (user_data.treatments or [])],
            experiences=[ExperienceResponse.model_validate(e) for e in (user_data.experiences or [])],
            loved_one_treatments=[
                TreatmentResponse.model_validate(t) for t in (user_data.loved_one_treatments or [])
            ],
            loved_one_experiences=[
                ExperienceResponse.model_validate(e) for e in (user_data.loved_one_experiences or [])
            ],
        )

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid user ID format: {exc}") from exc
    except Exception as exc:  # pragma: no cover - unexpected errors
        print(f"Error in get_user_data: {type(exc).__name__}: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))
"""Routes for accessing user data (UserData table)"""

from datetime import datetime as dt
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session, joinedload

from app.middleware.auth import has_roles
from app.models import Experience, Treatment, User, UserData
from app.schemas.user import UserRole
from app.utilities.db_utils import get_db

router = APIRouter(
    prefix="/user-data",
    tags=["user-data"],
)


class TreatmentResponse(BaseModel):
    """Response model for treatment"""
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)


class ExperienceResponse(BaseModel):
    """Response model for experience"""
    id: int
    name: str
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
...
            city=user_data.city,
            province=user_data.province,
            postal_code=user_data.postal_code,
            gender_identity=user_data.gender_identity,
            pronouns=user_data.pronouns,
            ethnic_group=user_data.ethnic_group,
            marital_status=user_data.marital_status,
            has_kids=user_data.has_kids,
<<<<<<< HEAD
            other_ethnic_group=user_data.other_ethnic_group,
            gender_identity_custom=user_data.gender_identity_custom,
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
        )

        return response

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
=======
            diagnosis=user_data.diagnosis,
            date_of_diagnosis=str(user_data.date_of_diagnosis) if user_data.date_of_diagnosis else None,
            other_ethnic_group=user_data.other_ethnic_group,
            gender_identity_custom=user_data.gender_identity_custom,
            has_blood_cancer=user_data.has_blood_cancer,
            caring_for_someone=user_data.caring_for_someone,
            loved_one_gender_identity=user_data.loved_one_gender_identity,
            loved_one_age=user_data.loved_one_age,
            loved_one_diagnosis=user_data.loved_one_diagnosis,
            loved_one_date_of_diagnosis=str(user_data.loved_one_date_of_diagnosis) if user_data.loved_one_date_of_diagnosis else None,
            treatments=[TreatmentResponse.model_validate(t) for t in (user_data.treatments or [])],
            experiences=[ExperienceResponse.model_validate(e) for e in (user_data.experiences or [])],
            loved_one_treatments=[TreatmentResponse.model_validate(t) for t in (user_data.loved_one_treatments or [])],
            loved_one_experiences=[ExperienceResponse.model_validate(e) for e in (user_data.loved_one_experiences or [])],
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid user ID format: {str(e)}")
    except Exception as e:
        # Log the actual error for debugging
        print(f"Error in get_user_data: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


>>>>>>> c7d6918 (add form pages to admin dashboard)
