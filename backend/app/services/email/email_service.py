from app.services.interfaces.email_service import IEmailService
from app.services.interfaces.email_service_provider import IEmailServiceProvider


class EmailService(IEmailService):
    def __init__(self, provider: IEmailServiceProvider):
        self.provider = provider

    def send_email(self, to: str, subject: str, body: str) -> dict:
        pass

    def send_welcome_email(self, recipient: str, user_name: str) -> dict:
        pass

    def send_password_reset_email(self, recipient: str, reset_link: str) -> dict:
        pass

    def send_notification_email(self, recipient: str, notification_text: str) -> dict:
        pass

    def _helper_method_example(self):
        pass
