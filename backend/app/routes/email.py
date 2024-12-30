from typing import Annotated

from fastapi import APIRouter, Depends

from app.interfaces.email_service import (
    EmailContent,
    EmailTemplate,
    IEmailService,
    TestEmailData,
)
from app.services.email.email_service import EmailService
from app.services.email.email_service_provider import (
    get_email_service_provider,
)

router = APIRouter(
    prefix="/email",
    tags=["email"],
)


def get_email_service() -> IEmailService:
    return EmailService(provider=get_email_service_provider())


# TODO (Mayank, Nov 30th) - Remove test emails once email service is fully implemented
@router.post("/send-test")
async def send_welcome_email(
    recipient: str,
    user_name: str,
    email_service: Annotated[IEmailService, Depends(get_email_service)],
):
    return email_service.send_email(
        template=EmailTemplate.TEST,
        content=EmailContent[TestEmailData](
            recipient=recipient, data=TestEmailData(name=user_name, date="2021-12-01")
        ),
    )
