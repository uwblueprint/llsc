import logging
import os

import firebase_admin.auth
from fastapi import HTTPException

from app.utilities.constants import LOGGER_NAME
from app.utilities.ses_email_service import SESEmailService

from ...interfaces.auth_service import IAuthService
from ...schemas.auth import AuthResponse, Token
from ...utilities.firebase_rest_client import FirebaseRestClient


class AuthService(IAuthService):
    def __init__(self, logger, user_service):
        self.logger = logging.getLogger(LOGGER_NAME("auth_service"))
        self.user_service = user_service
        self.firebase_client = FirebaseRestClient(logger)
        self.ses_email_service = SESEmailService()

    def generate_token(self, email: str, password: str) -> AuthResponse:
        try:
            token = self.firebase_client.sign_in_with_password(email, password)
            user = self.user_service.get_user_by_email(email)
            return AuthResponse(
                access_token=token.access_token,
                refresh_token=token.refresh_token,
                user=user,
            )
        except Exception as e:
            self.logger.error(f"Failed to generate token: {str(e)}")
            raise HTTPException(status_code=401, detail="Authentication failed")

    def generate_token_for_oauth(self, id_token: str) -> Token:
        # TODO: Implement OAuth token generation
        pass

    def revoke_tokens(self, user_id: str) -> None:
        try:
            auth_id = self.user_service.get_auth_id_by_user_id(user_id)
            firebase_admin.auth.revoke_refresh_tokens(auth_id)
        except Exception as e:
            self.logger.error(f"Failed to revoke tokens: {str(e)}")
            raise

    def renew_token(self, refresh_token: str) -> Token:
        return self.firebase_client.refresh_token(refresh_token)

    def reset_password(self, email: str) -> None:
        try:
            # Use Firebase Admin SDK to generate password reset link
            action_code_settings = firebase_admin.auth.ActionCodeSettings(
                url="http://localhost:3000/set-new-password",
                handle_code_in_app=True,
            )

            reset_link = firebase_admin.auth.generate_password_reset_link(email, action_code_settings)

            # Send via SES
            email_sent = self.ses_email_service.send_password_reset_email(email, reset_link)

            if email_sent:
                self.logger.info(f"Password reset email sent successfully to {email}")
            else:
                self.logger.warning(
                    f"Failed to send password reset email to {email}, but link was generated: {reset_link}"
                )
                # Do not raise, avoid revealing if email exists

        except Exception as e:
            self.logger.error(f"Failed to reset password: {str(e)}")
            # Don't raise exception for security reasons - don't reveal if email exists
            return

    def send_email_verification_link(self, email: str, language: str = None) -> None:
        try:
            # Get user's first name if available
            # Try Firebase first (for display_name), then fall back to database
            first_name = None
            try:
                # Try to get from Firebase user (display_name)
                try:
                    firebase_user = firebase_admin.auth.get_user_by_email(email)
                    if firebase_user and firebase_user.display_name:
                        # Extract first name from display_name (e.g., "John Doe" -> "John")
                        display_name = firebase_user.display_name.strip()
                        first_name = display_name.split()[0] if display_name else None
                        if first_name:
                            self.logger.info(
                                f"Found first name '{first_name}' from Firebase display_name for user {email}"
                            )
                    else:
                        self.logger.debug(f"Firebase user exists but display_name is None for {email}")
                except Exception as firebase_error:
                    self.logger.debug(f"Could not get Firebase user for {email}: {str(firebase_error)}")

                # Fall back to database if Firebase didn't have display_name
                if not first_name:
                    try:
                        user = self.user_service.get_user_by_email(email)
                        if user and user.first_name and user.first_name.strip():
                            first_name = user.first_name.strip()
                            self.logger.info(f"Found first name '{first_name}' from database for user {email}")
                        else:
                            self.logger.debug(f"No first name found in database for user {email}")
                    except Exception as db_error:
                        self.logger.debug(f"Could not get user from database for {email}: {str(db_error)}")
            except Exception as e:
                # If we can't get the user, continue without first name
                self.logger.debug(f"Could not retrieve user for email {email}: {str(e)}")
                pass

            # Normalize and validate language
            # If not provided, check environment variable, otherwise default to English
            if not language:
                language = os.getenv("EMAIL_LANGUAGE", "en").lower()
            else:
                language = language.lower()

            # Only allow 'en' or 'fr', default to 'en' for anything else
            if language not in ["en", "fr"]:
                language = "en"

            # Use Firebase Admin SDK to generate email verification link
            action_code_settings = firebase_admin.auth.ActionCodeSettings(
                url="http://localhost:3000/action",  # URL to redirect after verification
                handle_code_in_app=True,
            )

            # Generate the verification link
            verification_link = firebase_admin.auth.generate_email_verification_link(email, action_code_settings)

            # Send the verification email via SES (works with any email address)
            email_sent = self.ses_email_service.send_verification_email(email, verification_link, first_name, language)

            if email_sent:
                self.logger.info(f"Email verification sent successfully to {email}")
            else:
                # If SES fails, we can still provide the link for manual verification
                self.logger.warning(
                    f"Failed to send verification email to {email}, but link was generated: {verification_link}"
                )
                # For development/testing, you could log the link or store it temporarily
                # In production, you might want to implement a fallback mechanism

        except Exception as e:
            self.logger.error(f"Failed to send verification email: {str(e)}")
            # Don't raise exception for security reasons - don't reveal if email exists
            return

    def is_authorized_by_role(self, access_token: str, roles: set[str]) -> bool:
        try:
            decoded_token = firebase_admin.auth.verify_id_token(access_token, check_revoked=True)
            user_role = self.user_service.get_user_role_by_auth_id(decoded_token["uid"])
            firebase_user = firebase_admin.auth.get_user(decoded_token["uid"])
            result = firebase_user.email_verified and user_role in roles
            return result
        except Exception as e:
            print(f"Authorization error: {str(e)}")
            return False

    def is_authorized_by_user_id(self, access_token: str, requested_user_id: str) -> bool:
        try:
            decoded_token = firebase_admin.auth.verify_id_token(access_token, check_revoked=True)
            token_user_id = self.user_service.get_user_id_by_auth_id(decoded_token["uid"])
            firebase_user = firebase_admin.auth.get_user(decoded_token["uid"])
            return firebase_user.email_verified and token_user_id == requested_user_id
        except Exception as e:
            print(f"Authorization error: {str(e)}")
            return False

    def is_authorized_by_email(self, access_token: str, requested_email: str) -> bool:
        try:
            decoded_token = firebase_admin.auth.verify_id_token(access_token, check_revoked=True)
            firebase_user = firebase_admin.auth.get_user(decoded_token["uid"])
            return firebase_user.email_verified and decoded_token["email"] == requested_email
        except Exception as e:
            print(f"Authorization error: {str(e)}")
            return False

    def verify_email(self, email: str):
        try:
            user = self.user_service.get_user_by_email(email)
            if not user:
                self.logger.error(f"User not found for email: {email}")
                raise ValueError("User not found")

            if not user.auth_id:
                self.logger.error(f"User {user.id} has no auth_id")
                raise ValueError("User has no auth_id")

            self.logger.info(f"Updating email verification for user {user.id} with auth_id {user.auth_id}")
            firebase_admin.auth.update_user(user.auth_id, email_verified=True)
            self.logger.info(f"Successfully verified email for user {user.id}")

        except ValueError as e:
            # User not found in database - this might happen if there's a timing issue
            # between Firebase user creation and database user creation
            self.logger.warning(f"User not found in database for email {email}: {str(e)}")
            raise
        except Exception as e:
            self.logger.error(f"Failed to verify email for {email}: {str(e)}")
            raise
