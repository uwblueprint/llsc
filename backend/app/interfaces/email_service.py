import json
from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum
from typing import Generic, TypeVar

T = TypeVar("T")


class TemplateData(ABC):
    def get_formatted_string(self) -> str:
        class_dict = self.__dict__
        try:
            formatted_string = json.dumps(class_dict)  # Try to convert to a JSON string
        except (TypeError, ValueError) as e:
            # Handle errors and return a message instead
            return f"Error in converting data to JSON: {e}"

        return formatted_string


@dataclass
class TestEmailData(TemplateData):
    name: str
    date: str


class EmailTemplate(Enum):
    TEST = "Test"


@dataclass
class EmailContent(Generic[T]):
    recipient: str
    data: T


class IEmailService(ABC):
    """
    Interface for the Email Service, defining the core email operations such as
    sending templated and custom emails.
    """

    @abstractmethod
    def send_email(self, template: EmailTemplate, content: EmailContent) -> dict:
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
