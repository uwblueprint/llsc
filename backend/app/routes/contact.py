import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.middleware.auth import has_roles
from app.models import User
from app.schemas.contact import ContactRequest, ContactResponse
from app.schemas.user import UserRole
from app.utilities.constants import LOGGER_NAME
from app.utilities.db_utils import get_db

log = logging.getLogger(LOGGER_NAME("contact"))

router = APIRouter(
    prefix="/contact",
    tags=["contact"],
)


@router.post("/submit", response_model=ContactResponse)
async def submit_contact_form(
    contact_data: ContactRequest,
    request: Request,
    db: Session = Depends(get_db),
    authorized: bool = has_roles([UserRole.PARTICIPANT, UserRole.VOLUNTEER, UserRole.ADMIN]),
):
    """
    Submit a contact form message from a user.

    This endpoint receives contact form submissions from participants or volunteers
    and sends the message to the admin team.

    Args:
        contact_data: The contact form data (name, email, message)
        request: The FastAPI request object (contains user_id from auth middleware)
        db: Database session

    Returns:
        ContactResponse with success status and message
    """
    try:
        # Get current user from auth middleware
        current_user_auth_id = request.state.user_id
        current_user = db.query(User).filter(User.auth_id == current_user_auth_id).first()

        if not current_user:
            raise HTTPException(status_code=401, detail="User not found")

        # Log the contact form submission
        log.info(
            f"Contact form submission from user {current_user.id} "
            f"(name: {contact_data.name}, email: {contact_data.email})"
        )
        log.info(f"Message: {contact_data.message}")

        # TODO: Send email to admin team
        # This will be implemented in a future update
        # For now, we just log the message and return success

        return ContactResponse(
            success=True,
            message="Your message has been sent successfully. A staff member will get back to you as soon as possible.",
        )

    except HTTPException:
        raise
    except Exception as e:
        log.error(f"Error submitting contact form: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit contact form")
