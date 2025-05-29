import logging
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.interfaces.user_data_service import IUserDataService
from app.models import UserData
from app.schemas.user_data import (
    UserDataCreateRequest,
    UserDataResponse,
    UserDataUpdateRequest,
)
from app.utilities.constants import LOGGER_NAME


class UserDataService(IUserDataService):
    def __init__(self, db: Session):
        self.db = db
        self.logger = logging.getLogger(LOGGER_NAME("user_data_service"))

    def get_user_data_by_id(self, user_data_id: UUID) -> UserDataResponse:
        """Get user data by its ID"""
        user_data = self.db.query(UserData).filter(UserData.id == user_data_id).first()
        if not user_data:
            raise HTTPException(
                status_code=404, detail=f"User data with id {user_data_id} not found"
            )
        return UserDataResponse.model_validate(user_data)

    def get_user_data_by_user_id(self, user_id: UUID) -> UserDataResponse:
        """Get user data by user ID"""
        user_data = self.db.query(UserData).filter(UserData.user_id == user_id).first()
        if not user_data:
            raise HTTPException(
                status_code=404, detail=f"User data for user {user_id} not found"
            )
        return UserDataResponse.model_validate(user_data)

    def create_user_data(self, user_data: UserDataCreateRequest) -> UserDataResponse:
        """Create user data for a user"""
        try:
            # Check if user data already exists for this user
            existing_data = (
                self.db.query(UserData)
                .filter(UserData.user_id == user_data.user_id)
                .first()
            )
            if existing_data:
                raise HTTPException(
                    status_code=409,
                    detail=f"User data already exists for user {user_data.user_id}",
                )

            # Create new user data
            db_user_data = UserData(**user_data.model_dump())
            self.db.add(db_user_data)
            self.db.commit()
            self.db.refresh(db_user_data)

            return UserDataResponse.model_validate(db_user_data)

        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error creating user data: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    def update_user_data_by_user_id(
        self, user_id: UUID, user_data: UserDataUpdateRequest
    ) -> UserDataResponse:
        """Update user data for a user"""
        try:
            # Get existing user data
            db_user_data = (
                self.db.query(UserData).filter(UserData.user_id == user_id).first()
            )
            if not db_user_data:
                raise HTTPException(
                    status_code=404, detail=f"User data for user {user_id} not found"
                )

            # Update only provided fields
            update_data = user_data.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_user_data, key, value)

            self.db.commit()
            self.db.refresh(db_user_data)

            return UserDataResponse.model_validate(db_user_data)

        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error updating user data: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    def delete_user_data_by_id(self, user_data_id: UUID):
        """Delete user data by its ID"""
        try:
            user_data = (
                self.db.query(UserData).filter(UserData.id == user_data_id).first()
            )
            if not user_data:
                raise HTTPException(
                    status_code=404,
                    detail=f"User data with id {user_data_id} not found",
                )

            self.db.delete(user_data)
            self.db.commit()

        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error deleting user data: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    def delete_user_data_by_user_id(self, user_id: UUID):
        """Delete user data by user ID"""
        try:
            user_data = (
                self.db.query(UserData).filter(UserData.user_id == user_id).first()
            )
            if not user_data:
                raise HTTPException(
                    status_code=404, detail=f"User data for user {user_id} not found"
                )

            self.db.delete(user_data)
            self.db.commit()

        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error deleting user data: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
