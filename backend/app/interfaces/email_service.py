from abc import ABC, abstractmethod


class IEmailService(ABC):
    """
    Interface for the Email Service, defining the core email operations such as
    sending templated and custom emails.
    """

    @abstractmethod
    def send_email(self, subject: str, recipient: str, body_html: str) -> None:
        """
        Sends an email with the given parameters.

        :param to: Recipient's email address
        :type to: str
        :param subject: Subject of the email
        :type subject: str
        :param body: HTML body content of the email
        :type body: str
        :return: Provider-specific metadata (like message ID, thread ID, label IDs)
        :rtype: dict
        :raises Exception: if email was not sent successfully
        """
        pass
