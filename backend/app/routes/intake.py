from datetime import datetime
from typing import List, Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.middleware.auth import has_roles
from app.models import Experience, Form, FormSubmission, Treatment, User
from app.schemas.user import UserRole
from app.services.implementations.intake_form_processor import IntakeFormProcessor
from app.utilities.db_utils import get_db

# ===== Schemas =====


class FormResponse(BaseModel):
    """Response schema for form"""

    id: UUID
    name: str
    version: int
    type: str

    model_config = ConfigDict(from_attributes=True)


class FormSubmissionCreate(BaseModel):
    """Schema for creating a new form submission"""

    form_id: Optional[UUID] = Field(
        None, description="Form ID (optional - will be auto-detected from formType if not provided)"
    )
    user_id: Optional[UUID] = Field(
        None,
        description="Target user ID (admin-only). Defaults to the currently authenticated user.",
    )
    answers: dict = Field(..., description="Form answers as JSON")


class FormSubmissionUpdate(BaseModel):
    """Schema for updating a form submission"""

    answers: dict = Field(..., description="Updated form answers as JSON")


class FormSubmissionResponse(BaseModel):
    """Response schema for form submission"""

    id: UUID
    form_id: UUID
    user_id: UUID
    submitted_at: datetime
    answers: dict
    form: Optional[FormResponse] = None

    model_config = ConfigDict(from_attributes=True)


class FormSubmissionListResponse(BaseModel):
    """Response schema for listing form submissions"""

    submissions: List[FormSubmissionResponse]
    total: int


class ExperienceResponse(BaseModel):
    id: int
    name: str
    scope: Literal["patient", "caregiver", "both", "none"]
    model_config = ConfigDict(from_attributes=True)


class TreatmentResponse(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)


class OptionsResponse(BaseModel):
    experiences: List[ExperienceResponse]
    treatments: List[TreatmentResponse]


# ===== Custom Auth Helpers =====


async def ensure_owner_or_admin(request: Request, db: Session, user_id: UUID) -> None:
    """
    Utility helper that mirrors the access control applied in read endpoints.
    """

    current_user_auth_id = request.state.user_id
    current_user = db.query(User).filter(User.auth_id == current_user_auth_id).first()

    if not current_user:
        raise HTTPException(status_code=401, detail="User not found")

    if current_user.role.name != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")


# ===== Router Setup =====

router = APIRouter(
    prefix="/intake",
    tags=["intake"],
)


# ===== CRUD Endpoints =====


@router.post("/submissions", response_model=FormSubmissionResponse)
async def create_form_submission(
    submission: FormSubmissionCreate,
    request: Request,
    db: Session = Depends(get_db),
    authorized: bool = has_roles([UserRole.ADMIN, UserRole.PARTICIPANT, UserRole.VOLUNTEER]),
):
    """
    Create a new form submission and process it into structured data.

    Users can only create submissions for themselves.

    The form_id is optional - if not provided, it will be auto-detected
    from the 'formType' field in the answers (participant/volunteer).
    """
    try:
        # Get current user
        current_user_auth_id = request.state.user_id
        current_user = db.query(User).filter(User.auth_id == current_user_auth_id).first()
        if not current_user:
            raise HTTPException(status_code=401, detail="User not found")

        # Determine the target user for which the submission will be created
        target_user = current_user
        if submission.user_id:
            # Only admins can create submissions on behalf of other users
            if current_user.role.name != "admin" and submission.user_id != current_user.id:
                raise HTTPException(status_code=403, detail="You can only create forms for yourself")

            target_user = db.query(User).filter(User.id == submission.user_id).first()
            if not target_user:
                raise HTTPException(status_code=404, detail="Target user not found")

        # Determine form_id if not provided and derive effective form_type for auth check
        form_id = submission.form_id
        effective_form_type = None
        if not form_id:
            effective_form_type = submission.answers.get("form_type")
            if not effective_form_type:
                raise HTTPException(
                    status_code=400, detail="form_type must be specified in answers when form_id is not provided"
                )

            # Map formType to form name
            form_name_mapping = {"participant": "Participant Intake Form", "volunteer": "Volunteer Intake Form"}

            form_name = form_name_mapping.get(effective_form_type)
            if not form_name:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid formType: {effective_form_type}. Must be 'participant' or 'volunteer'",
                )

            # Find the form
            form = db.query(Form).filter(Form.type == "intake", Form.name == form_name).first()

            if not form:
                raise HTTPException(status_code=500, detail=f"Intake form '{form_name}' not found in database")
            form_id = form.id
        else:
            # Verify the form exists and is of type 'intake'
            form = db.query(Form).filter(Form.id == form_id).first()
            if not form:
                raise HTTPException(status_code=404, detail="Form not found")
            # Derive effective type from form name
            if "Participant" in form.name:
                effective_form_type = "participant"
            elif "Volunteer" in form.name:
                effective_form_type = "volunteer"

        # Enforce role-to-form access (admin exempt)
        if current_user.role.name != "admin":
            if current_user.role.name == "volunteer" and effective_form_type != "volunteer":
                raise HTTPException(status_code=403, detail="Volunteers can only submit the volunteer intake form")
            if current_user.role.name == "participant" and effective_form_type != "participant":
                raise HTTPException(status_code=403, detail="Participants can only submit the participant intake form")

        # Create the raw form submission record
        db_submission = FormSubmission(
            form_id=form_id,
            user_id=target_user.id,
            answers=submission.answers,
        )

        db.add(db_submission)
        db.flush()  # Get the submission ID without committing

        # Process intake forms into structured tables when appropriate
        should_process_intake = (
            form
            and form.type == "intake"
            and isinstance(submission.answers, dict)
            and submission.answers.get("personal_info")
        )
        if should_process_intake:
            processor = IntakeFormProcessor(db)
            processor.process_form_submission(user_id=str(target_user.id), form_data=submission.answers)

        # Commit everything together
        db.commit()
        db.refresh(db_submission)

        return FormSubmissionResponse.model_validate(db_submission)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing form submission: {str(e)}")


@router.get("/submissions", response_model=FormSubmissionListResponse)
async def get_form_submissions(
    user_id: Optional[UUID] = Query(None, description="Filter by user ID (admin only)"),
    form_id: Optional[UUID] = Query(None, description="Filter by form ID"),
    request: Request = None,
    db: Session = Depends(get_db),
    authorized: bool = has_roles([UserRole.ADMIN, UserRole.PARTICIPANT, UserRole.VOLUNTEER]),
):
    """
    Get form submissions.

    - Regular users can only see their own submissions
    - Admins can see all submissions and filter by user_id
    """
    try:
        # Get current user
        current_user_auth_id = request.state.user_id
        current_user = db.query(User).filter(User.auth_id == current_user_auth_id).first()
        if not current_user:
            raise HTTPException(status_code=401, detail="User not found")

        # Build query - include all form types, not just intake
        query = db.query(FormSubmission).join(Form)

        # Apply filters based on user role
        if current_user.role_id == 3:  # Admin
            # Admins can filter by any user_id
            if user_id:
                query = query.filter(FormSubmission.user_id == user_id)
        else:
            # Non-admins can only see their own submissions
            query = query.filter(FormSubmission.user_id == current_user.id)
            if user_id and str(user_id) != str(current_user.id):
                raise HTTPException(status_code=403, detail="You can only view your own submissions")

        # Apply form_id filter if provided
        if form_id:
            query = query.filter(FormSubmission.form_id == form_id)

        # Execute query with eager loading of form relationship
        from sqlalchemy.orm import joinedload
        submissions = query.options(joinedload(FormSubmission.form)).all()

        # Build response with form data included
        submission_responses = []
        for s in submissions:
            submission_dict = {
                "id": s.id,
                "form_id": s.form_id,
                "user_id": s.user_id,
                "submitted_at": s.submitted_at,
                "answers": s.answers,
                "form": {
                    "id": s.form.id,
                    "name": s.form.name,
                    "version": s.form.version,
                    "type": s.form.type,
                } if s.form else None,
            }
            submission_responses.append(FormSubmissionResponse.model_validate(submission_dict))

        return FormSubmissionListResponse(
            submissions=submission_responses, total=len(submission_responses)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/submissions/{submission_id}", response_model=FormSubmissionResponse)
async def get_form_submission(
    submission_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    authorized: bool = has_roles([UserRole.ADMIN, UserRole.PARTICIPANT, UserRole.VOLUNTEER]),
):
    """
    Get a specific form submission by ID.

    Users can only access their own submissions unless they are admin.
    """
    try:
        # Get the submission with eager loading of form relationship
        from sqlalchemy.orm import joinedload
        submission = (
            db.query(FormSubmission)
            .options(joinedload(FormSubmission.form))
            .filter(FormSubmission.id == submission_id)
            .first()
        )

        if not submission:
            raise HTTPException(status_code=404, detail="Form submission not found")

        # Check access permissions
        current_user_auth_id = request.state.user_id
        current_user = db.query(User).filter(User.auth_id == current_user_auth_id).first()

        if not current_user:
            raise HTTPException(status_code=401, detail="User not found")

        # Check if user is admin or the owner of the resource
        if current_user.role.name != "admin" and current_user.id != submission.user_id:
            raise HTTPException(status_code=403, detail="Access denied")

        # Build response with form data included (same as list endpoint)
        submission_dict = {
            "id": submission.id,
            "form_id": submission.form_id,
            "user_id": submission.user_id,
            "submitted_at": submission.submitted_at,
            "answers": submission.answers,
            "form": {
                "id": submission.form.id,
                "name": submission.form.name,
                "version": submission.form.version,
                "type": submission.form.type,
            } if submission.form else None,
        }

        return FormSubmissionResponse.model_validate(submission_dict)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/submissions/{submission_id}", response_model=FormSubmissionResponse)
async def update_form_submission(
    submission_id: UUID,
    update_data: FormSubmissionUpdate,
    request: Request,
    db: Session = Depends(get_db),
    authorized: bool = has_roles([UserRole.ADMIN, UserRole.PARTICIPANT, UserRole.VOLUNTEER]),
):
    """
    Update a form submission.

    Users can only update their own submissions unless they are admin.
    """
    try:
        # Get the submission
        submission = db.query(FormSubmission).filter(FormSubmission.id == submission_id).first()

        if not submission:
            raise HTTPException(status_code=404, detail="Form submission not found")

        # Check access permissions
        await ensure_owner_or_admin(request, db, submission.user_id)

        # Update the submission
        submission.answers = update_data.answers

        db.commit()
        db.refresh(submission)

        return FormSubmissionResponse.model_validate(submission)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/submissions/{submission_id}")
async def delete_form_submission(
    submission_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    authorized: bool = has_roles([UserRole.ADMIN, UserRole.PARTICIPANT, UserRole.VOLUNTEER]),
):
    """
    Delete a form submission.

    Users can only delete their own submissions unless they are admin.
    """
    try:
        # Get the submission
        submission = db.query(FormSubmission).filter(FormSubmission.id == submission_id).first()

        if not submission:
            raise HTTPException(status_code=404, detail="Form submission not found")

        # Check access permissions
        await ensure_owner_or_admin(request, db, submission.user_id)

        # Delete the submission
        db.delete(submission)
        db.commit()

        return {"message": "Form submission deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/options",
    response_model=OptionsResponse,
)
async def get_intake_options(
    request: Request,
    target: str = Query(..., pattern="^(patient|caregiver|both)$"),
    db: Session = Depends(get_db),
    authorized: bool = has_roles([UserRole.PARTICIPANT, UserRole.VOLUNTEER, UserRole.ADMIN]),
):
    try:
        # Query DB Experience Table
        experiences_query = db.query(Experience)
        if target != "both":
            experiences_query = experiences_query.filter(or_(Experience.scope == target, Experience.scope == "both"))
        experiences = experiences_query.order_by(Experience.id.asc()).all()

        treatments = db.query(Treatment).order_by(Treatment.id.asc()).all()
        return OptionsResponse.model_validate({"experiences": experiences, "treatments": treatments})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===== Additional Utility Endpoints =====


@router.get("/forms", response_model=List[dict])
async def get_intake_forms(
    db: Session = Depends(get_db),
    authorized: bool = has_roles([UserRole.ADMIN, UserRole.PARTICIPANT, UserRole.VOLUNTEER]),
):
    """
    Get all available intake forms.
    """
    try:
        forms = db.query(Form).filter(Form.type == "intake").all()

        return [{"id": str(form.id), "name": form.name, "version": form.version, "type": form.type} for form in forms]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
