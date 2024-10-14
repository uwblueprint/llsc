from abc import ABC, abstractmethod

class IEmailService(ABC):
    """
    Interface for the Email Service, defining the core email operations such as sending templated and custom emails.
    """

    @abstractmethod
    def send_email(self, to: str, subject: str, body: str) -> dict:
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

    @abstractmethod
    def send_welcome_email(self, recipient: str, user_name: str) -> dict:
        """
        Sends a welcome email to the specified user.
        
        :param recipient: Email address of the user
        :type recipient: str
        :param user_name: Name of the user
        :type user_name: str
        :return: Provider-specific metadata for the sent email
        :rtype: dict
        :raises Exception: if email was not sent successfully
        """
        pass

    @abstractmethod
    def send_password_reset_email(self, recipient: str, reset_link: str) -> dict:
        """
        Sends a password reset email with the provided reset link.

        :param recipient: Email address of the user requesting the reset
        :type recipient: str
        :param reset_link: Password reset link
        :type reset_link: str
        :return: Provider-specific metadata for the sent email
        :rtype: dict
        :raises Exception: if email was not sent successfully
        """
        pass

    @abstractmethod
    def send_notification_email(self, recipient: str, notification_text: str) -> dict:
        """
        Sends a notification email to the user with the provided notification text.
        Examples of use case include matches completed and ready to view, new messages,
        meeting time scheduled, etc.

        :param recipient: Email address of the user
        :type recipient: str
        :param notification_text: The notification content
        :type notification_text: str
        :return: Provider-specific metadata for the sent email
        :rtype: dict
        :raises Exception: if email was not sent successfully
        """
        pass