import logging

from app.interfaces.email_service import IEmailService
from app.interfaces.email_service_provider import IEmailServiceProvider


# TODO (Mayank, Nov 30th) - Implement the email service methods and use User object
class EmailService(IEmailService):
    def __init__(self, provider: IEmailServiceProvider):
        self.provider = provider
        self.logger = logging.getLogger(__name__)

    def send_email(self, subject: str, recipient: str, body_html: str = "") -> None:
        self.logger.info(f"Sending email to {recipient} with subject: {subject}")
        self.provider.send_email(subject, recipient)
