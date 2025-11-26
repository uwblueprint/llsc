from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.middleware.auth import has_roles
from app.models import Experience, Treatment, User, UserData
from app.schemas.availability import AvailabilityTemplateSlot
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
        current_user = db.query(User).filter(User.auth_id == current_user_auth_id).first()

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
                end_time=template.end_time.isoformat()
            )
            for template in current_user.availability_templates
            if template.is_active
        ]

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
                user_data.loved_one_date_of_diagnosis.isoformat()
                if user_data.loved_one_date_of_diagnosis
                else None
            ),
            loved_one_treatments=[treatment.name for treatment in user_data.loved_one_treatments],
            loved_one_experiences=[experience.name for experience in user_data.loved_one_experiences],
            # Flow Control
            has_blood_cancer=user_data.has_blood_cancer,
            caring_for_someone=user_data.caring_for_someone,
            # Availability
            availability=availability_templates,
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
        from datetime import datetime as dt

        # Get current user from auth middleware
        current_user_auth_id = request.state.user_id
        current_user = db.query(User).filter(User.auth_id == current_user_auth_id).first()

        if not current_user:
            raise HTTPException(status_code=401, detail="User not found")

        # Get UserData for current user
        user_data = db.query(UserData).filter(UserData.user_id == current_user.id).first()

        if not user_data:
            raise HTTPException(status_code=404, detail="User data not found")

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

        db.commit()
        db.refresh(user_data)

        # Return updated data using the same logic as GET
        availability_templates = [
            AvailabilityTemplateResponse(
                day_of_week=template.day_of_week,
                start_time=template.start_time.isoformat(),
                end_time=template.end_time.isoformat()
            )
            for template in current_user.availability_templates
            if template.is_active
        ]

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
