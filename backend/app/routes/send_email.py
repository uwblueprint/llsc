from typing import Annotated

from fastapi import APIRouter, Depends

from app.interfaces.email_service import IEmailService
from app.services.email.email_service import EmailService
from app.services.email.email_service_provider import AmazonSESEmailProvider

router = APIRouter(
    prefix="/email",
    tags=["email"],
)


def get_email_service() -> IEmailService:
    email_provider = AmazonSESEmailProvider(aws_access_key="", aws_secret_key="")
    return EmailService(email_provider)


# TODO (Mayank, Nov 30th) - Remove test emails once email service is fully implemented
@router.post("/send-test-email/")
async def send_welcome_email(
    recipient: str,
    user_name: str,
    email_service: Annotated[IEmailService, Depends(get_email_service)],
):
    email_service.send_welcome_email(recipient, user_name)
    return {"message": f"Welcome email sent to {user_name}!"}
