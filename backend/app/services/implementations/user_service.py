import logging
import os
import requests

import firebase_admin.auth
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.interfaces.user_service import IUserService
from app.models import Role, User
from app.schemas.user import (
    SignUpMethod,
    UserCreateRequest,
    UserCreateResponse,
    UserRole,
)
from app.utilities.constants import LOGGER_NAME


class UserService(IUserService):
    def __init__(self, db: Session):
        self.db = db
        self.logger = logging.getLogger(LOGGER_NAME("user_service"))

    async def create_user(self, user: UserCreateRequest) -> UserCreateResponse:
        firebase_user = None
        try:
            if user.signup_method == SignUpMethod.PASSWORD:
                # Use Firebase REST API to create user and get ID token
                url = f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={os.getenv('FIREBASE_WEB_API_KEY')}"
                data = {
                    "email": user.email,
                    "password": user.password,
                    "returnSecureToken": True
                }
                
                self.logger.info(f"Creating Firebase user via REST API: {user.email}")
                response = requests.post(url, json=data)
                response_json = response.json()
                
                self.logger.info(f"Firebase signup response status: {response.status_code}")
                self.logger.info(f"Firebase signup response: {response_json}")
                
                if response.status_code == 200:
                    # User created successfully, get the Firebase user and ID token
                    auth_id = response_json.get("localId")
                    id_token = response_json.get("idToken")
                    firebase_user = firebase_admin.auth.get_user(auth_id)
                    
                    # Send verification email using the ID token for authentication
                    self.logger.info(f"User created successfully, sending verification email to {user.email}")
                    
                    verify_url = f"https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key={os.getenv('FIREBASE_WEB_API_KEY')}"
                    verify_data = {
                        "requestType": "VERIFY_EMAIL",
                        "idToken": id_token,
                        "continueUrl": "http://localhost:3000/action"
                    }
                    
                    verify_response = requests.post(verify_url, json=verify_data)
                    verify_response_json = verify_response.json()
                    
                    self.logger.info(f"Verification email response status: {verify_response.status_code}")
                    self.logger.info(f"Verification email response: {verify_response_json}")
                    
                    if verify_response.status_code == 200:
                        self.logger.info(f"Verification email sent successfully to {user.email}")
                    else:
                        error_message = verify_response_json.get("error", {}).get("message", "Unknown error")
                        self.logger.error(f"Failed to send verification email: {error_message}")
                        # Don't fail user creation if email verification fails
                else:
                    error_message = response_json.get("error", {}).get("message", "Unknown error")
                    self.logger.error(f"Failed to create Firebase user: {error_message}")
                    raise HTTPException(status_code=400, detail=f"Failed to create user: {error_message}")
                    
            ## TO DO: SSO functionality depends a lot on frontend implementation,
            ##   so we may need to update this when we have a better idea of what
            ##   that looks like
            elif user.signup_method == SignUpMethod.GOOGLE:
                # For signup with Google, Firebase users are automatically created
                firebase_user = firebase_admin.auth.get_user(user.auth_id)

            role_id = UserRole.to_role_id(user.role)

            # Create user in database
            db_user = User(
                first_name=user.first_name,
                last_name=user.last_name,
                email=user.email,
                role_id=role_id,
                auth_id=firebase_user.uid,
            )

            self.db.add(db_user)
            # Finish database transaction and run previously defined
            #   database operations (ie. db.add)
            self.db.commit()

            return UserCreateResponse.model_validate(db_user)

        except firebase_admin.exceptions.FirebaseError as firebase_error:
            self.logger.error(f"Firebase error: {str(firebase_error)}")

            if isinstance(firebase_error, firebase_admin.auth.EmailAlreadyExistsError):
                raise HTTPException(status_code=409, detail="Email already exists")

            raise HTTPException(status_code=400, detail=str(firebase_error))

        except Exception as e:
            # Clean up Firebase user if a database exception occurs
            if firebase_user:
                try:
                    firebase_admin.auth.delete_user(firebase_user.uid)
                except firebase_admin.auth.AuthError as firebase_error:
                    self.logger.error(
                        "Failed to delete Firebase user after database insertion failed"
                        f"Firebase UID: {firebase_user.uid}. "
                        f"Error: {str(firebase_error)}"
                    )

            # Rollback database changes
            self.db.rollback()
            self.logger.error(f"Error creating user: {str(e)}")

            raise HTTPException(status_code=500, detail=str(e))

    def delete_user_by_email(self, email: str):
        pass

    def delete_user_by_id(self, user_id: str):
        pass

    def get_user_id_by_auth_id(self, auth_id: str) -> str:
        """Get user ID for a user by their Firebase auth_id"""
        user = self.db.query(User).filter(User.auth_id == auth_id).first()
        if not user:
            raise ValueError(f"User with auth_id {auth_id} not found")
        return str(user.id)  # Convert UUID to string

    def get_user_by_email(self, email: str):
        user = self.db.query(User).filter(User.email == email).first()
        if not user:
            raise ValueError(f"User with email {email} not found")
        return user

    def get_user_by_id(self, user_id: str):
        pass

    def get_auth_id_by_user_id(self, user_id: str) -> str:
        """Get Firebase auth_id for a user"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"User with id {user_id} not found")
        return user.auth_id

    def get_user_role_by_auth_id(self, auth_id: str) -> str:
        """Get role name for a user by their Firebase auth_id"""
        user = self.db.query(User).join(Role).filter(User.auth_id == auth_id).first()
        if not user:
            raise ValueError(f"User with auth_id {auth_id} not found")
        return user.role.name

    def get_users(self):
        pass

    def update_user_by_id(self, user_id: str, user):
        pass
