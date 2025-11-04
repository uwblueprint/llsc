import json
import logging
import os
from typing import Any, Dict

import boto3
from botocore.exceptions import ClientError

from app.utilities.constants import LOGGER_NAME


class SESEmailService:
    def __init__(self):
        self.logger = logging.getLogger(LOGGER_NAME("ses_email_service"))
        self.aws_region = os.getenv("AWS_REGION")
        self.aws_access_key = os.getenv("AWS_ACCESS_KEY")
        self.aws_secret_key = os.getenv("AWS_SECRET_KEY")
        self.source_email = os.getenv("SES_SOURCE_EMAIL")

        if not all([self.aws_region, self.aws_access_key, self.aws_secret_key, self.source_email]):
            self.logger.warning("SES credentials not fully configured. Email sending will be disabled.")
            self.ses_client = None
        else:
            try:
                self.ses_client = boto3.client(
                    "ses",
                    region_name=self.aws_region,
                    aws_access_key_id=self.aws_access_key,
                    aws_secret_access_key=self.aws_secret_key,
                )
                self.logger.info("SES client initialized successfully")
            except Exception as e:
                self.logger.error(f"Failed to initialize SES client: {str(e)}")
                self.ses_client = None

    def verify_email_address(self, email: str) -> bool:
        """
        Verify an email address in SES (for sandbox mode)
        """
        if not self.ses_client:
            return False

        try:
            self.ses_client.verify_email_identity(EmailAddress=email)
            self.logger.info(f"Email verification request sent to {email}")
            return True
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'AlreadyExists':
                self.logger.info(f"Email {email} is already verified")
                return True
            else:
                self.logger.error(f"Failed to verify email {email}: {error_code}")
                return False

    def send_templated_email(self, to_email: str, template_name: str, template_data: Dict[str, Any]) -> bool:
        """
        Send a templated email using SES
        
        Args:
            to_email: Recipient email address
            template_name: Name of the SES template
            template_data: Data to populate template variables
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        if not self.ses_client:
            self.logger.error("SES client not available. Cannot send email.")
            return False

        try:
            response = self.ses_client.send_templated_email(
                Source=self.source_email,
                Destination={'ToAddresses': [to_email]},
                Template=template_name,
                TemplateData=json.dumps(template_data)
            )

            self.logger.info(f"Email sent successfully to {to_email}. MessageId: {response['MessageId']}")
            return True

        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']

            if error_code == 'MessageRejected' and 'not verified' in error_message:
                # Try to verify the email address automatically
                self.logger.info(f"Email {to_email} not verified. Attempting to verify...")
                if self.verify_email_address(to_email):
                    self.logger.info(f"Email verification request sent to {to_email}. Please check your email and verify.")
                else:
                    self.logger.error(f"Failed to send verification request for {to_email}")
                return False
            else:
                self.logger.error(f"Failed to send email to {to_email}. Error: {error_code} - {error_message}")
                return False
        except Exception as e:
            self.logger.error(f"Unexpected error sending email to {to_email}: {str(e)}")
            return False

    def send_verification_email(self, to_email: str, verification_link: str) -> bool:
        """
        Send email verification email
        
        Args:
            to_email: Recipient email address
            verification_link: Firebase verification link
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        template_data = {
            "verification_link": verification_link
        }

        return self.send_templated_email(to_email, "EmailVerification", template_data)

    def send_password_reset_email(self, to_email: str, reset_link: str) -> bool:
        """
        Send password reset email
        
        Args:
            to_email: Recipient email address
            reset_link: Firebase password reset link
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        template_data = {
            "reset_link": reset_link
        }

        return self.send_templated_email(to_email, "PasswordReset", template_data)
