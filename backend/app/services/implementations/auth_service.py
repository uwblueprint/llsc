import logging
import os

import firebase_admin.auth
import requests
from fastapi import HTTPException

from app.utilities.constants import LOGGER_NAME

from ...interfaces.auth_service import IAuthService
from ...schemas.auth import AuthResponse, Token
from ...utilities.firebase_rest_client import FirebaseRestClient


class AuthService(IAuthService):
    def __init__(self, logger, user_service):
        self.logger = logging.getLogger(LOGGER_NAME("auth_service"))
        self.user_service = user_service
        self.firebase_client = FirebaseRestClient(logger)

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
            # Use Firebase REST API to send password reset email
            url = f"https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key={os.getenv('FIREBASE_WEB_API_KEY')}"
            data = {
                "requestType": "PASSWORD_RESET",
                "email": email,
                "continueUrl": "http://localhost:3000/set-new-password"  # Custom action URL
            }

            response = requests.post(url, json=data)
            response_json = response.json()

            if response.status_code != 200:
                error_message = response_json.get("error", {}).get("message", "Unknown error")
                self.logger.error(f"Failed to send password reset email: {error_message}")
                # Don't raise exception for security reasons - don't reveal if email exists
                return

            self.logger.info(f"Password reset email sent successfully to {email}")

        except Exception as e:
            self.logger.error(f"Failed to reset password: {str(e)}")
            # Don't raise exception for security reasons - don't reveal if email exists
            return

    def send_email_verification_link(self, email: str) -> None:
        try:
            firebase_admin.auth.generate_email_verification_link(email)
        except Exception as e:
            self.logger.error(f"Failed to send verification email: {str(e)}")
            raise

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
