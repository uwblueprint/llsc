from app.interfaces.email_service_provider import IEmailServiceProvider


class AmazonSESEmailProvider(IEmailServiceProvider):
    def __init__(self, aws_access_key: str, aws_secret_key: str):
        pass

    # TODO (Mayank, Nov 30th) - Create an email object to pass into this method
    def send_email(
        self, recipient: str, subject: str, body_html: str, body_text: str
    ) -> dict:
        pass
