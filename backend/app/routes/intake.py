from typing import List, Optional
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, ConfigDict

from app.middleware.auth import has_roles
from app.schemas.user import UserRole
from app.models import FormSubmission, Form, User
from app.utilities.db_utils import get_db

# ===== Schemas =====

class FormSubmissionCreate(BaseModel):
    """Schema for creating a new form submission"""
    form_id: UUID
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
    
    model_config = ConfigDict(from_attributes=True)


class FormSubmissionListResponse(BaseModel):
    """Response schema for listing form submissions"""
    submissions: List[FormSubmissionResponse]
    total: int


# ===== Custom Auth Dependencies =====

def is_owner_or_admin(user_id: UUID):
    """
    Custom dependency that checks if the current user is either:
    1. The owner of the resource (matching user_id)
    2. An admin
    
    This allows users to access their own data while admins can access everything.
    """
    async def validator(
        request: Request,
        db: Session = Depends(get_db),
        authorized: bool = has_roles([UserRole.ADMIN, UserRole.PARTICIPANT, UserRole.VOLUNTEER])
    ) -> bool:
        # Get current user info from request state (set by auth middleware)
        current_user_auth_id = request.state.user_id
        
        # Get the current user from database
        current_user = db.query(User).filter(User.auth_id == current_user_auth_id).first()
        if not current_user:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Check if user is admin (role_id 3)
        if current_user.role_id == 3:  # Admin role
            return True
        
        # Check if user is the owner
        if str(current_user.id) == str(user_id):
            return True
        
        raise HTTPException(
            status_code=403,
            detail="Access denied: You can only access your own submissions"
        )
    
    return Depends(validator)


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
    authorized: bool = has_roles([UserRole.ADMIN, UserRole.PARTICIPANT, UserRole.VOLUNTEER])
):
    """
    Create a new form submission.
    
    Users can only create submissions for themselves.
    """
    try:
        # Get current user
        current_user_auth_id = request.state.user_id
        current_user = db.query(User).filter(User.auth_id == current_user_auth_id).first()
        if not current_user:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Verify the form exists and is of type 'intake'
        form = db.query(Form).filter(
            Form.id == submission.form_id,
            Form.type == "intake"
        ).first()
        if not form:
            raise HTTPException(status_code=404, detail="Intake form not found")
        
        # Create the submission
        db_submission = FormSubmission(
            form_id=submission.form_id,
            user_id=current_user.id,  # Always use the current user's ID
            answers=submission.answers
        )
        
        db.add(db_submission)
        db.commit()
        db.refresh(db_submission)
        
        return FormSubmissionResponse.model_validate(db_submission)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/submissions", response_model=FormSubmissionListResponse)
async def get_form_submissions(
    user_id: Optional[UUID] = Query(None, description="Filter by user ID (admin only)"),
    form_id: Optional[UUID] = Query(None, description="Filter by form ID"),
    request: Request = None,
    db: Session = Depends(get_db),
    authorized: bool = has_roles([UserRole.ADMIN, UserRole.PARTICIPANT, UserRole.VOLUNTEER])
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
        
        # Build query
        query = db.query(FormSubmission).join(Form).filter(Form.type == "intake")
        
        # Apply filters based on user role
        if current_user.role_id == 3:  # Admin
            # Admins can filter by any user_id
            if user_id:
                query = query.filter(FormSubmission.user_id == user_id)
        else:
            # Non-admins can only see their own submissions
            query = query.filter(FormSubmission.user_id == current_user.id)
            if user_id and str(user_id) != str(current_user.id):
                raise HTTPException(
                    status_code=403,
                    detail="You can only view your own submissions"
                )
        
        # Apply form_id filter if provided
        if form_id:
            query = query.filter(FormSubmission.form_id == form_id)
        
        # Execute query
        submissions = query.all()
        
        return FormSubmissionListResponse(
            submissions=[FormSubmissionResponse.model_validate(s) for s in submissions],
            total=len(submissions)
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
    authorized: bool = has_roles([UserRole.ADMIN, UserRole.PARTICIPANT, UserRole.VOLUNTEER])
):
    """
    Get a specific form submission by ID.
    
    Users can only access their own submissions unless they are admin.
    """
    try:
        # Get the submission
        submission = db.query(FormSubmission).filter(
            FormSubmission.id == submission_id
        ).first()
        
        if not submission:
            raise HTTPException(status_code=404, detail="Form submission not found")
        
        # Check access permissions
        await is_owner_or_admin(submission.user_id)(request, db)
        
        return FormSubmissionResponse.model_validate(submission)
        
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
    authorized: bool = has_roles([UserRole.ADMIN, UserRole.PARTICIPANT, UserRole.VOLUNTEER])
):
    """
    Update a form submission.
    
    Users can only update their own submissions unless they are admin.
    """
    try:
        # Get the submission
        submission = db.query(FormSubmission).filter(
            FormSubmission.id == submission_id
        ).first()
        
        if not submission:
            raise HTTPException(status_code=404, detail="Form submission not found")
        
        # Check access permissions
        await is_owner_or_admin(submission.user_id)(request, db)
        
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
    authorized: bool = has_roles([UserRole.ADMIN, UserRole.PARTICIPANT, UserRole.VOLUNTEER])
):
    """
    Delete a form submission.
    
    Users can only delete their own submissions unless they are admin.
    """
    try:
        # Get the submission
        submission = db.query(FormSubmission).filter(
            FormSubmission.id == submission_id
        ).first()
        
        if not submission:
            raise HTTPException(status_code=404, detail="Form submission not found")
        
        # Check access permissions
        await is_owner_or_admin(submission.user_id)(request, db)
        
        # Delete the submission
        db.delete(submission)
        db.commit()
        
        return {"message": "Form submission deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ===== Additional Utility Endpoints =====

@router.get("/forms", response_model=List[dict])
async def get_intake_forms(
    db: Session = Depends(get_db),
    authorized: bool = has_roles([UserRole.ADMIN, UserRole.PARTICIPANT, UserRole.VOLUNTEER])
):
    """
    Get all available intake forms.
    """
    try:
        forms = db.query(Form).filter(Form.type == "intake").all()
        
        return [
            {
                "id": str(form.id),
                "name": form.name,
                "version": form.version,
                "type": form.type
            }
            for form in forms
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 