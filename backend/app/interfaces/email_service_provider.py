from abc import ABC, abstractmethod

from app.interfaces.email_service import EmailContent, EmailTemplate


class IEmailServiceProvider(ABC):
    """
    Interface for Email Providers that interact with external
    email services (e.g., Amazon SES).
    """

    @abstractmethod
    def send_email(self, template: EmailTemplate, content: EmailContent) -> dict:
        """
        Sends an email using the provider's service.

        :param recipient: Email address of the recipient
        :type recipient: str
        :param subject: Subject of the email
        :type subject: str
        :param body_html: HTML body content of the email
        :type body_html: str
        :param body_text: Plain text content of the email
        :type body_text: str
        :return: Provider-specific metadata related to the sent email
        (like message ID, status, etc.)
        :rtype: dict
        :raises Exception: if the email fails to send
        """
        pass
