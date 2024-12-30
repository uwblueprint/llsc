import logging
from typing import Annotated

from fastapi import APIRouter, Depends

from app.interfaces.email_service import IEmailService
from app.services.email.email_service import EmailService
from app.services.email.email_service_provider import (
    get_email_service_provider,
)

router = APIRouter(
    prefix="/email",
    tags=["email"],
)

log = logging.getLogger("uvicorn")


def get_email_service() -> IEmailService:
    return EmailService(get_email_service_provider())


# TODO (Mayank, Nov 30th) - Remove test emails once email service is fully implemented
@router.post("/send-test")
async def send_welcome_email(
    recipient: str,
    user_name: str,
    email_service: Annotated[IEmailService, Depends(get_email_service)],
):
    log.info(f"Main Sending welcome email to {user_name} at {recipient}")
    email_service.send_email(
        subject="Welcome to the app!",
        recipient=recipient,
    )
    return {"message": f"Welcome email sent to {user_name}!"}
