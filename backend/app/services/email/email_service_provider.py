import os

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import HTTPException

from app.interfaces.email_service_provider import IEmailServiceProvider


class AmazonSESEmailProvider(IEmailServiceProvider):
    def __init__(
        self,
        aws_access_key: str,
        aws_secret_key: str,
        region: str,
        source_email: str,
        is_sandbox: bool = True,
    ):
        self.source_email = source_email
        self.is_sandbox = is_sandbox
        self.ses_client = boto3.client(
            "ses",
            region_name=region,
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
        )

    def _verify_email(self, email: str):
        if not self.is_sandbox:
            return
        try:
            self.client.verify_email_identity(EmailAddress=email)
            print(f"Verification email sent to {email}.")
        except Exception as e:
            print(f"Failed to verify email: {e}")

    def send_email(self, subject: str, recipient: str) -> None:
        try:
            self._verify_email(recipient)
            self.ses_client.send_email(
                Source=self.source_email,
                Destination={"ToAddresses": [recipient]},
                Message={
                    "Subject": {"Data": subject},
                    "Body": {"Text": {"Data": "Hello, this is a test email!"}},
                },
            )
        except BotoCoreError as e:
            raise HTTPException(status_code=500, detail=f"SES BotoCoreError: {e}")
        except ClientError as e:
            raise HTTPException(
                status_code=500,
                detail=f"SES ClientError: {e.response['Error']['Message']}",
            )


def get_email_service_provider() -> IEmailServiceProvider:
    return AmazonSESEmailProvider(
        aws_access_key=os.getenv("AWS_ACCESS_KEY"),
        aws_secret_key=os.getenv("AWS_SECRET_KEY"),
        region=os.getenv("AWS_REGION"),
        source_email=os.getenv("SES_SOURCE_EMAIL"),
    )
