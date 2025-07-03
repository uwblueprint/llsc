import logging
from typing import List
from uuid import UUID
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
    UserResponse,
    UserRole,
    UserUpdateRequest,
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
                firebase_user = firebase_admin.auth.create_user(
                    email=user.email, password=user.password
                )
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

    async def delete_user_by_email(self, email: str):
        try:
            db_user = self.db.query(User).filter(User.email == email).first()
            if not db_user:
                raise HTTPException(status_code=404, detail="User not found")

            self.db.delete(db_user)
            self.db.commit()

        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error deleting user with email {email}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def delete_user_by_id(self, user_id: str):
        try:
            db_user = self.db.query(User).filter(User.id == UUID(user_id)).first()
            if not db_user:
                raise HTTPException(status_code=404, detail="User not found")

            self.db.delete(db_user)
            self.db.commit()

        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error deleting user {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def soft_delete_user_by_id(self, user_id: str):
        try:
            db_user = self.db.query(User).filter(User.id == UUID(user_id)).first()
            if not db_user:
                raise HTTPException(status_code=404, detail="User not found")

            db_user.active = False
            self.db.commit()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error deactivating user {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def get_user_id_by_auth_id(self, auth_id: str) -> str:
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

    async def get_user_by_id(self, user_id: str) -> UserResponse:
        try:
            user = self.db.query(User).join(Role).filter(User.id == UUID(user_id)).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            return UserResponse.model_validate(user)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Error retrieving user {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

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

    async def get_users(self) -> List[UserResponse]:
        try:
            # Filter users to only include participants and volunteers (role_id 1 and 2)
            users = self.db.query(User).join(Role).filter(User.role_id.in_([1, 2])).all()
            return [UserResponse.model_validate(user) for user in users]
        except Exception as e:
            self.logger.error(f"Error getting users: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def get_admins(self) -> List[UserResponse]:
        try:
            # Get only admin users (role_id 3)
            users = self.db.query(User).join(Role).filter(User.role_id == 3).all()
            return [UserResponse.model_validate(user) for user in users]
        except Exception as e:
            self.logger.error(f"Error retrieving admin users: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def update_user_by_id(self, user_id: str, user_update: UserUpdateRequest) -> UserResponse:
        try:
            db_user = self.db.query(User).filter(User.id == UUID(user_id)).first()
            if not db_user:
                raise HTTPException(status_code=404, detail="User not found")

            # update provided fields only
            update_data = user_update.model_dump(exclude_unset=True)

            # handle role conversion if role is being updated
            if "role" in update_data:
                update_data["role_id"] = UserRole.to_role_id(update_data.pop("role"))

            for field, value in update_data.items():
                setattr(db_user, field, value)

            self.db.commit()
            self.db.refresh(db_user)

            # return user with role information
            updated_user = self.db.query(User).join(Role).filter(User.id == UUID(user_id)).first()
            return UserResponse.model_validate(updated_user)

        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error updating user {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
