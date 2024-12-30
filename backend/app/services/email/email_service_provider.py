import os

import boto3
from botocore.exceptions import ClientError

from app.interfaces.email_service import EmailContent, EmailTemplate
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

        self.verified_emails = None
        if self.is_sandbox:
            response = self.ses_client.list_verified_email_addresses()
            self.verified_emails = response.get("VerifiedEmailAddresses", [])

    def _verify_email(self, email: str):
        if not self.is_sandbox:
            return
        try:
            if email not in self.verified_emails:
                self.ses_client.verify_email_identity(EmailAddress=email)
                print(f"Verification email sent to {email}.")
        except Exception as e:
            print(f"Failed to verify email: {e}")

    def send_email(self, template: EmailTemplate, content: EmailContent) -> dict:
        try:
            self._verify_email(content.recipient)

            self.ses_client.get_template(TemplateName=template.value)

            template_data = content.data.get_formatted_string()

            response = self.ses_client.send_templated_email(
                Source=self.source_email,
                Destination={"ToAddresses": [content.recipient]},
                Template=template.value,
                TemplateData=template_data,
            )

            return {
                "message": "Email sent successfully!",
                "message_id": response["MessageId"],
            }
        except ClientError as e:
            return {"error": f"An error occurred: {e.response['Error']['Message']}"}


def get_email_service_provider() -> IEmailServiceProvider:
    return AmazonSESEmailProvider(
        aws_access_key=os.getenv("AWS_ACCESS_KEY"),
        aws_secret_key=os.getenv("AWS_SECRET_KEY"),
        region=os.getenv("AWS_REGION"),
        source_email=os.getenv("SES_SOURCE_EMAIL"),
    )
