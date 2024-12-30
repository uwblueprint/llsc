import logging

from app.interfaces.email_service import EmailContent, EmailTemplate, IEmailService, T
from app.interfaces.email_service_provider import IEmailServiceProvider


# TODO (Mayank, Nov 30th) - Implement the email service methods and use User object
class EmailService(IEmailService):
    def __init__(self, provider: IEmailServiceProvider):
        self.provider = provider
        self.logger = logging.getLogger(__name__)

    # def render_templates(self, template: EmailTemplate) -> tuple[str, str]:
    #     html_path = self.template_dir / f"{template.value}.html"
    #     text_path = self.template_dir / f"{template.value}.txt"

    #      # Check if both files exist
    #     if not html_path.exists():
    #         raise FileNotFoundError(f"HTML template not found: {html_path}")
    #     if not text_path.exists():
    #         raise FileNotFoundError(f"Text template not found: {text_path}")

    #     # Read the templates
    #     html_template = html_path.read_text(encoding="utf-8")
    #     text_template = text_path.read_text(encoding="utf-8")

    #     return html_template, text_template

    def send_email(self, template: EmailTemplate, content: EmailContent[T]) -> dict:
        self.logger.info(
            f"Sending email to {content.recipient} with template {template.value}"
        )
        # html_template, text_template = self.render_templates(template)
        return self.provider.send_email(template, content)
