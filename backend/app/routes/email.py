# routers/emails.py
from fastapi import APIRouter, Depends
from app.services.interfaces.email_service import IEmailService
from app.services.email.email_service import EmailService
from app.services.email.email_service_provider import AmazonSESEmailProvider

router = APIRouter()

def get_email_service() -> IEmailService:
    email_provider = AmazonSESEmailProvider(aws_access_key = "", aws_secret_key ="")
    return EmailService(email_provider)

@router.post("/send-test-email/")
async def send_welcome_email(recipient: str, user_name: str, email_service: IEmailService = Depends(get_email_service)):
    email_service.send_welcome_email(recipient, user_name)
    return {"message": f"Welcome email sent to {user_name}!"}
