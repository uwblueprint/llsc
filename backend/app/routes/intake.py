from datetime import datetime
from typing import List, Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.middleware.auth import has_roles
from app.models import Experience, Form, FormSubmission, Treatment, User
from app.models.User import FormStatus, Language
from app.schemas.user import UserRole
from app.services.implementations.form_processor import FormProcessor
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
    status: Literal["pending_approval", "approved", "rejected"]
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
            form_name_mapping = {
                "participant": "First Connection Participant Form",
                "volunteer": "First Connection Volunteer Form",
            }

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

        # Create the raw form submission record with pending status
        db_submission = FormSubmission(
            form_id=form_id,
            user_id=target_user.id,
            answers=submission.answers,
            status="pending_approval",
        )

        db.add(db_submission)
        db.flush()  # Get the submission ID without committing

        # For intake forms: Update essential fields on User and set form_status
        # Full processing to UserData happens on admin approval
        if form and form.type == "intake" and isinstance(submission.answers, dict):
            personal_info = submission.answers.get("personal_info", {})

            # Update essential fields on User record
            if personal_info.get("first_name"):
                target_user.first_name = personal_info["first_name"]
            if personal_info.get("last_name"):
                target_user.last_name = personal_info["last_name"]

            # Update language if provided in demographics
            demographics = submission.answers.get("demographics", {})
            preferred_language = demographics.get("preferred_language")
            if preferred_language:
                if preferred_language.lower() in ["en", "english"]:
                    target_user.language = Language.ENGLISH
                elif preferred_language.lower() in ["fr", "french"]:
                    target_user.language = Language.FRENCH

            # Update form_status to indicate intake was submitted (pending approval)
            target_user.form_status = FormStatus.INTAKE_SUBMITTED

        # NOTE: IntakeFormProcessor is NOT called here anymore.
        # Full processing happens when admin approves the form.

        # Commit everything together
        db.commit()
        db.refresh(db_submission)

        # Build response dict
        response_dict = {
            "id": db_submission.id,
            "form_id": db_submission.form_id,
            "user_id": db_submission.user_id,
            "submitted_at": db_submission.submitted_at,
            "answers": db_submission.answers,
            "status": db_submission.status,
            "form": {
                "id": form.id,
                "name": form.name,
                "version": form.version,
                "type": form.type,
            }
            if form
            else None,
        }

        return FormSubmissionResponse.model_validate(response_dict)

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
                "status": s.status,
                "form": {
                    "id": s.form.id,
                    "name": s.form.name,
                    "version": s.form.version,
                    "type": s.form.type,
                }
                if s.form
                else None,
            }
            submission_responses.append(FormSubmissionResponse.model_validate(submission_dict))

        return FormSubmissionListResponse(submissions=submission_responses, total=len(submission_responses))

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
            "status": submission.status,
            "form": {
                "id": submission.form.id,
                "name": submission.form.name,
                "version": submission.form.version,
                "type": submission.form.type,
            }
            if submission.form
            else None,
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
    authorized: bool = has_roles([UserRole.ADMIN]),  # Only admins can edit
):
    """
    Update a form submission (admin only).

    Admins can edit pending_approval and rejected forms, but not approved forms.
    """
    try:
        # Get the submission with eager loading of form relationship
        submission = (
            db.query(FormSubmission)
            .options(joinedload(FormSubmission.form))
            .filter(FormSubmission.id == submission_id)
            .first()
        )

        if not submission:
            raise HTTPException(status_code=404, detail="Form submission not found")

        # Update the submission
        submission.answers = update_data.answers

        # If form is approved, re-process it to update specialized tables
        if submission.status == "approved":
            # Get the user for processing
            user = db.query(User).filter(User.id == submission.user_id).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            # Re-process the form (processors are idempotent)
            processor = FormProcessor(db)
            processor.process_approved_submission(submission)
            # Note: Don't change user.form_status - they're already past this step

        db.commit()
        db.refresh(submission)

        # Build response dict with form data included
        response_dict = {
            "id": submission.id,
            "form_id": submission.form_id,
            "user_id": submission.user_id,
            "submitted_at": submission.submitted_at,
            "answers": submission.answers,
            "status": submission.status,
            "form": {
                "id": submission.form.id,
                "name": submission.form.name,
                "version": submission.form.version,
                "type": submission.form.type,
            }
            if submission.form
            else None,
        }

        return FormSubmissionResponse.model_validate(response_dict)

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


# ===== Approval Workflow Endpoints =====


@router.post("/submissions/{submission_id}/approve")
async def approve_form_submission(
    submission_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    """
    Approve a form submission and process it into specialized tables.

    Only pending_approval forms can be approved.
    Processing is done based on form type (intake, ranking, secondary).
    """
    try:
        # Get the submission with form relationship
        submission = db.query(FormSubmission).filter(FormSubmission.id == submission_id).first()

        if not submission:
            raise HTTPException(status_code=404, detail="Form submission not found")

        if submission.status != "pending_approval":
            raise HTTPException(
                status_code=400,
                detail=f"Can only approve pending forms. Current status: {submission.status}",
            )

        # Eagerly load the form relationship for processing
        if not submission.form:
            raise HTTPException(status_code=500, detail="Form submission has no associated form")

        # Process the submission using FormProcessor
        processor = FormProcessor(db)
        processor.process_approved_submission(submission)

        # Update status to approved
        submission.status = "approved"
        db.commit()

        return {"status": "approved", "message": "Form approved and processed successfully"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process form: {str(e)}")


@router.post("/submissions/{submission_id}/reject")
async def reject_form_submission(
    submission_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    """
    Reject a form submission.

    Only pending_approval forms can be rejected.
    """
    try:
        submission = db.query(FormSubmission).filter(FormSubmission.id == submission_id).first()

        if not submission:
            raise HTTPException(status_code=404, detail="Form submission not found")

        if submission.status != "pending_approval":
            raise HTTPException(
                status_code=400,
                detail=f"Can only reject pending forms. Current status: {submission.status}",
            )

        # Update status
        submission.status = "rejected"
        db.commit()

        return {"status": "rejected", "message": "Form rejected successfully"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/submissions/{submission_id}/resubmit")
async def resubmit_form_submission(
    submission_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    """
    Resubmit a rejected form (admin changes status back to pending_approval).

    Only rejected forms can be resubmitted.
    Use this after editing a rejected form to put it back in the review queue.
    """
    try:
        submission = db.query(FormSubmission).filter(FormSubmission.id == submission_id).first()

        if not submission:
            raise HTTPException(status_code=404, detail="Form submission not found")

        if submission.status != "rejected":
            raise HTTPException(
                status_code=400,
                detail=f"Can only resubmit rejected forms. Current status: {submission.status}",
            )

        # Update status back to pending
        submission.status = "pending_approval"
        db.commit()

        return {"status": "pending_approval", "message": "Form resubmitted for approval"}

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
