import logging
from typing import Optional

import firebase_admin.auth
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import User
from app.schemas.user import SignUpMethod, UserCreateRequest, UserCreateResponse, UserRole
from app.services.interfaces.user_service import IUserService


class UserService(IUserService):
    def __init__(self, db: Session):
        self.db = db
        self.logger = logging.getLogger(__name__)

    async def create_user(
        self, 
        user: UserCreateRequest
    ) -> UserCreateResponse:
        firebase_user = None
        try:
            if user.signup_method == SignUpMethod.PASSWORD:
                firebase_user = firebase_admin.auth.create_user(
                    email=user.email, 
                    password=user.password
                )
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
                raise HTTPException(
                    status_code=409, 
                    detail="Email already exists"
                )

            raise HTTPException(
                status_code=400, 
                detail=str(firebase_error)
            )

        except Exception as e:
            # Clean up Firebase user if a database exception occurs
            if firebase_user:
                try:
                    firebase_admin.auth.delete_user(firebase_user.uid)
                except firebase_admin.auth.AuthError as firebase_error:
                    self.logger.error(
                        "Failed to delete Firebase user after database insertion failed. "
                        f"Firebase UID: {firebase_user.uid}. "
                        f"Error: {str(firebase_error)}"
                    )

            # Rollback database changes
            self.db.rollback()
            self.logger.error(f"Error creating user: {str(e)}")
            
            raise HTTPException(
                status_code=500, 
                detail=str(e)
            )

    def delete_user_by_email(self, email: str):
        pass

    def delete_user_by_id(self, user_id: str):
        pass

    def get_auth_id_by_user_id(self, user_id: str) -> str:
        pass

    def get_user_by_email(self, email: str):
        pass

    def get_user_by_id(self, user_id: str):
        pass

    def get_user_id_by_auth_id(self, auth_id: str) -> str:
        pass

    def get_user_role_by_auth_id(self, auth_id: str) -> str:
        pass

    def get_users(self):
        pass

    def update_user_by_id(self, user_id: str, user):
        pass
