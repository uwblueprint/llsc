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

    # ---------------------------------------------------------------------
    # Internal helpers
    # ---------------------------------------------------------------------

    @staticmethod
    def _serialise_preferences(preferences):
        """Ensure preferences are stored as a comma-separated string.

        The API allows the client to send either a list of strings **or** a
        comma-separated string.  This helper converts the list form into the
        canonical string representation used in the database.
        """
        if preferences is None:
            return None

        # If the incoming value is already a string, strip extra whitespace
        if isinstance(preferences, str):
            # Collapse any excess whitespace around commas
            return ", ".join([p.strip() for p in preferences.split(",") if p.strip()])

        # If it is a list/tuple, join using a comma and space
        if isinstance(preferences, (list, tuple)):
            return ", ".join([str(p).strip() for p in preferences if str(p).strip()])

        # Fallback – we do not expect other types, but log in case
        logging.getLogger(LOGGER_NAME("user_data_service")).warning(
            "Unexpected preferences data type %s – storing as string", type(preferences)
        )
        return str(preferences)

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

            # Prepare payload – ensure preferences field is in the correct format
            data_dict = user_data.model_dump()
            data_dict["preferences"] = self._serialise_preferences(
                data_dict.get("preferences")
            )

            # Create new user data
            db_user_data = UserData(**data_dict)
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

            # Serialise preferences if present
            if "preferences" in update_data:
                update_data["preferences"] = self._serialise_preferences(update_data["preferences"])

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
