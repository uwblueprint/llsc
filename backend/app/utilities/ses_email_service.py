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
        self.source_email_en = os.getenv("SES_SOURCE_EMAIL", "FirstConnections@bloodcancers.ca")
        self.source_email_fr = os.getenv(
            "SES_SOURCE_EMAIL_FR", os.getenv("SES_SOURCE_EMAIL", "FirstConnections@bloodcancers.ca")
        )

        # Use English source email as default for backwards compatibility
        self.source_email = self.source_email_en

        if not all([self.aws_region, self.aws_access_key, self.aws_secret_key, self.source_email_en]):
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
            error_code = e.response["Error"]["Code"]
            if error_code == "AlreadyExists":
                self.logger.info(f"Email {email} is already verified")
                return True
            else:
                self.logger.error(f"Failed to verify email {email}: {error_code}")
                return False

    def send_templated_email(
        self, to_email: str, template_name: str, template_data: Dict[str, Any], source_email: str = None
    ) -> bool:
        """
        Send a templated email using SES

        Args:
            to_email: Recipient email address
            template_name: Name of the SES template
            template_data: Data to populate template variables
            source_email: Source email address (optional, defaults to self.source_email)

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        if not self.ses_client:
            self.logger.error("SES client not available. Cannot send email.")
            return False

        # Use provided source email or fall back to default
        from_email = source_email if source_email else self.source_email

        try:
            response = self.ses_client.send_templated_email(
                Source=from_email,
                Destination={"ToAddresses": [to_email]},
                Template=template_name,
                TemplateData=json.dumps(template_data),
            )

            self.logger.info(f"Email sent successfully to {to_email}. MessageId: {response['MessageId']}")
            return True

        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            error_message = e.response["Error"]["Message"]

            if error_code == "MessageRejected" and "not verified" in error_message:
                # Try to verify the email address automatically
                self.logger.info(f"Email {to_email} not verified. Attempting to verify...")
                if self.verify_email_address(to_email):
                    self.logger.info(
                        f"Email verification request sent to {to_email}. Please check your email and verify."
                    )
                else:
                    self.logger.error(f"Failed to send verification request for {to_email}")
                return False
            else:
                self.logger.error(f"Failed to send email to {to_email}. Error: {error_code} - {error_message}")
                return False
        except Exception as e:
            self.logger.error(f"Unexpected error sending email to {to_email}: {str(e)}")
            return False

    def send_verification_email(
        self, to_email: str, verification_link: str, first_name: str = None, language: str = "en"
    ) -> bool:
        """
        Send email verification email

        Args:
            to_email: Recipient email address
            verification_link: Firebase verification link
            first_name: User's first name (optional)
            language: Language code ("en" for English, "fr" for French). Defaults to "en"

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        # Normalize language code
        language = language.lower() if language else "en"
        if language not in ["en", "fr"]:
            language = "en"  # Default to English if invalid language

        template_name = "EmailVerificationEn" if language == "en" else "EmailVerificationFr"
        # Use appropriate source email based on language
        source_email = self.source_email_en if language == "en" else self.source_email_fr

        template_data = {"verification_link": verification_link, "first_name": first_name if first_name else "there"}

        return self.send_templated_email(to_email, template_name, template_data, source_email)

    def send_password_reset_email(
        self, to_email: str, reset_link: str, first_name: str = None, language: str = "en"
    ) -> bool:
        """
        Send password reset email

        Args:
            to_email: Recipient email address
            reset_link: Firebase password reset link
            first_name: User's first name (optional)
            language: Language code ("en" for English, "fr" for French). Defaults to "en"

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        # Normalize language code
        language = language.lower() if language else "en"
        if language not in ["en", "fr"]:
            language = "en"

        template_name = "PasswordResetEn" if language == "en" else "PasswordResetFr"
        source_email = self.source_email_en if language == "en" else self.source_email_fr

        template_data = {"reset_link": reset_link, "first_name": first_name if first_name else "there"}

        return self.send_templated_email(to_email, template_name, template_data, source_email)

    def send_intake_form_confirmation_email(self, to_email: str, first_name: str = None, language: str = "en") -> bool:
        """
        Send intake form confirmation email

        Args:
            to_email: Recipient email address
            first_name: User's first name (optional)
            language: Language code ("en" for English, "fr" for French). Defaults to "en"

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        # Normalize language code
        language = language.lower() if language else "en"
        if language not in ["en", "fr"]:
            language = "en"

        template_name = "IntakeFormConfirmationEn" if language == "en" else "IntakeFormConfirmationFr"
        source_email = self.source_email_en if language == "en" else self.source_email_fr

        template_data = {"first_name": first_name if first_name else "there"}

        return self.send_templated_email(to_email, template_name, template_data, source_email)

    def send_matches_available_email(
        self, to_email: str, first_name: str = None, matches_url: str = None, language: str = "en"
    ) -> bool:
        """
        Send matches available email

        Args:
            to_email: Recipient email address
            first_name: User's first name (optional)
            matches_url: URL to view matches (optional, defaults to dashboard)
            language: Language code ("en" for English, "fr" for French). Defaults to "en"

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        # Normalize language code
        language = language.lower() if language else "en"
        if language not in ["en", "fr"]:
            language = "en"

        template_name = "MatchesAvailableEn" if language == "en" else "MatchesAvailableFr"
        source_email = self.source_email_en if language == "en" else self.source_email_fr

        # Default to dashboard if no specific URL provided
        if not matches_url:
            matches_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/participant/dashboard"

        template_data = {"first_name": first_name if first_name else "there", "matches_url": matches_url}

        return self.send_templated_email(to_email, template_name, template_data, source_email)

    def send_call_scheduled_email(
        self,
        to_email: str,
        match_name: str,
        date: str,
        time: str,
        timezone: str,
        first_name: str = None,
        scheduled_calls_url: str = None,
        language: str = "en",
    ) -> bool:
        """
        Send call scheduled confirmation email

        Args:
            to_email: Recipient email address
            match_name: Name of the person they're meeting with
            date: Date of the call
            time: Time of the call
            timezone: Timezone of the call
            first_name: User's first name (optional)
            scheduled_calls_url: URL to view scheduled calls (optional, defaults to dashboard)
            language: Language code ("en" for English, "fr" for French). Defaults to "en"

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        # Normalize language code
        language = language.lower() if language else "en"
        if language not in ["en", "fr"]:
            language = "en"

        template_name = "CallScheduledEn" if language == "en" else "CallScheduledFr"
        source_email = self.source_email_en if language == "en" else self.source_email_fr

        # Default to dashboard if no specific URL provided
        if not scheduled_calls_url:
            scheduled_calls_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/participant/dashboard"

        template_data = {
            "first_name": first_name if first_name else "there",
            "match_name": match_name,
            "date": date,
            "time": time,
            "timezone": timezone,
            "scheduled_calls_url": scheduled_calls_url,
        }

        return self.send_templated_email(to_email, template_name, template_data, source_email)

    def send_participant_requested_new_times_email(
        self,
        to_email: str,
        participant_name: str,
        first_name: str = None,
        matches_url: str = None,
        language: str = "en",
    ) -> bool:
        """
        Send participant requested new times email (to volunteer)

        Args:
            to_email: Volunteer email address
            participant_name: Name of the participant who requested new times
            first_name: Volunteer's first name (optional)
            matches_url: URL to view matches (optional, defaults to dashboard)
            language: Language code ("en" for English, "fr" for French). Defaults to "en"

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        # Normalize language code
        language = language.lower() if language else "en"
        if language not in ["en", "fr"]:
            language = "en"

        template_name = "ParticipantRequestedNewTimesEn" if language == "en" else "ParticipantRequestedNewTimesFr"
        source_email = self.source_email_en if language == "en" else self.source_email_fr

        # Default to dashboard if no specific URL provided
        if not matches_url:
            matches_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/volunteer/dashboard"

        template_data = {
            "first_name": first_name if first_name else "there",
            "participant_name": participant_name,
            "matches_url": matches_url,
        }

        return self.send_templated_email(to_email, template_name, template_data, source_email)

    def send_volunteer_accepted_new_times_email(
        self,
        to_email: str,
        volunteer_name: str,
        date: str,
        time: str,
        timezone: str,
        first_name: str = None,
        scheduled_calls_url: str = None,
        language: str = "en",
    ) -> bool:
        """
        Send volunteer accepted new times email (to participant)

        Args:
            to_email: Participant email address
            volunteer_name: Name of the volunteer who accepted new times
            date: Date of the call
            time: Time of the call
            timezone: Timezone of the call
            first_name: Participant's first name (optional)
            scheduled_calls_url: URL to view scheduled calls (optional, defaults to dashboard)
            language: Language code ("en" for English, "fr" for French). Defaults to "en"

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        # Normalize language code
        language = language.lower() if language else "en"
        if language not in ["en", "fr"]:
            language = "en"

        template_name = "VolunteerAcceptedNewTimesEn" if language == "en" else "VolunteerAcceptedNewTimesFr"
        source_email = self.source_email_en if language == "en" else self.source_email_fr

        # Default to dashboard if no specific URL provided
        if not scheduled_calls_url:
            scheduled_calls_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/participant/dashboard"

        template_data = {
            "first_name": first_name if first_name else "there",
            "volunteer_name": volunteer_name,
            "date": date,
            "time": time,
            "timezone": timezone,
            "scheduled_calls_url": scheduled_calls_url,
        }

        return self.send_templated_email(to_email, template_name, template_data, source_email)

    def send_participant_cancelled_email(
        self,
        to_email: str,
        participant_name: str,
        date: str,
        time: str,
        timezone: str,
        first_name: str = None,
        dashboard_url: str = None,
        language: str = "en",
    ) -> bool:
        """
        Send participant cancelled call email (to volunteer)

        Args:
            to_email: Volunteer email address
            participant_name: Name of the participant who cancelled
            date: Date of the cancelled call
            time: Time of the cancelled call
            timezone: Timezone of the cancelled call
            first_name: Volunteer's first name (optional)
            dashboard_url: URL to volunteer dashboard (optional, defaults to dashboard)
            language: Language code ("en" for English, "fr" for French). Defaults to "en"

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        # Normalize language code
        language = language.lower() if language else "en"
        if language not in ["en", "fr"]:
            language = "en"

        template_name = "ParticipantCancelledEn" if language == "en" else "ParticipantCancelledFr"
        source_email = self.source_email_en if language == "en" else self.source_email_fr

        # Default to dashboard if no specific URL provided
        if not dashboard_url:
            dashboard_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/volunteer/dashboard"

        template_data = {
            "first_name": first_name if first_name else "there",
            "participant_name": participant_name,
            "date": date,
            "time": time,
            "timezone": timezone,
            "dashboard_url": dashboard_url,
        }

        return self.send_templated_email(to_email, template_name, template_data, source_email)

    def send_volunteer_cancelled_email(
        self,
        to_email: str,
        volunteer_name: str,
        date: str,
        time: str,
        timezone: str,
        first_name: str = None,
        request_matches_url: str = None,
        language: str = "en",
    ) -> bool:
        """
        Send volunteer cancelled call email (to participant)

        Args:
            to_email: Participant email address
            volunteer_name: Name of the volunteer who cancelled
            date: Date of the cancelled call
            time: Time of the cancelled call
            timezone: Timezone of the cancelled call
            first_name: Participant's first name (optional)
            request_matches_url: URL to request new matches (optional, defaults to dashboard)
            language: Language code ("en" for English, "fr" for French). Defaults to "en"

        Returns:
            bool: True if email sent successfully, False otherwise
        """
        # Normalize language code
        language = language.lower() if language else "en"
        if language not in ["en", "fr"]:
            language = "en"

        template_name = "VolunteerCancelledEn" if language == "en" else "VolunteerCancelledFr"
        source_email = self.source_email_en if language == "en" else self.source_email_fr

        # Default to dashboard if no specific URL provided
        if not request_matches_url:
            request_matches_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/participant/dashboard"

        template_data = {
            "first_name": first_name if first_name else "there",
            "volunteer_name": volunteer_name,
            "date": date,
            "time": time,
            "timezone": timezone,
            "request_matches_url": request_matches_url,
        }

        return self.send_templated_email(to_email, template_name, template_data, source_email)
