import logging
from typing import List
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.interfaces.volunteer_data_service import IVolunteerDataService
from app.models.VolunteerData import VolunteerData
from app.schemas.volunteer_data import (
    VolunteerDataCreateRequest,
    VolunteerDataResponse,
    VolunteerDataUpdateRequest,
)
from app.utilities.constants import LOGGER_NAME


class VolunteerDataService(IVolunteerDataService):
    def __init__(self, db: Session):
        self.db = db
        self.logger = logging.getLogger(LOGGER_NAME("volunteer_data_service"))

    async def create_volunteer_data(
        self, volunteer_data: VolunteerDataCreateRequest
    ) -> VolunteerDataResponse:
        try:
            # Check if volunteer data already exists for this user
            existing_data = (
                self.db.query(VolunteerData)
                .filter(VolunteerData.user_id == volunteer_data.user_id)
                .first()
            )
            if existing_data:
                raise HTTPException(
                    status_code=409,
                    detail="Volunteer data already exists for this user"
                )

            # Create new volunteer data entry
            db_volunteer_data = VolunteerData(
                user_id=volunteer_data.user_id,
                experience=volunteer_data.experience,
                references_json=volunteer_data.references_json,
                additional_comments=volunteer_data.additional_comments,
            )

            self.db.add(db_volunteer_data)
            self.db.commit()
            self.db.refresh(db_volunteer_data)

            return VolunteerDataResponse.model_validate(db_volunteer_data)

        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error creating volunteer data: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def get_volunteer_data_by_id(self, volunteer_data_id: str) -> VolunteerDataResponse:
        try:
            volunteer_data = (
                self.db.query(VolunteerData)
                .filter(VolunteerData.id == UUID(volunteer_data_id))
                .first()
            )
            if not volunteer_data:
                raise HTTPException(status_code=404, detail="Volunteer data not found")

            return VolunteerDataResponse.model_validate(volunteer_data)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid volunteer data ID format")
        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Error retrieving volunteer data {volunteer_data_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def get_volunteer_data_by_user_id(self, user_id: str) -> VolunteerDataResponse:
        try:
            volunteer_data = (
                self.db.query(VolunteerData)
                .filter(VolunteerData.user_id == UUID(user_id))
                .first()
            )
            if not volunteer_data:
                raise HTTPException(status_code=404, detail="Volunteer data not found for this user")

            return VolunteerDataResponse.model_validate(volunteer_data)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Error retrieving volunteer data for user {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def get_all_volunteer_data(self) -> List[VolunteerDataResponse]:
        try:
            volunteer_data_list = self.db.query(VolunteerData).all()
            return [VolunteerDataResponse.model_validate(data) for data in volunteer_data_list]
        except Exception as e:
            self.logger.error(f"Error getting all volunteer data: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def update_volunteer_data_by_id(
        self, volunteer_data_id: str, volunteer_data_update: VolunteerDataUpdateRequest
    ) -> VolunteerDataResponse:
        try:
            db_volunteer_data = (
                self.db.query(VolunteerData)
                .filter(VolunteerData.id == UUID(volunteer_data_id))
                .first()
            )
            if not db_volunteer_data:
                raise HTTPException(status_code=404, detail="Volunteer data not found")

            # Update provided fields only
            update_data = volunteer_data_update.model_dump(exclude_unset=True)

            for field, value in update_data.items():
                setattr(db_volunteer_data, field, value)

            self.db.commit()
            self.db.refresh(db_volunteer_data)

            return VolunteerDataResponse.model_validate(db_volunteer_data)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid volunteer data ID format")
        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error updating volunteer data {volunteer_data_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    async def delete_volunteer_data_by_id(self, volunteer_data_id: str) -> None:
        try:
            db_volunteer_data = (
                self.db.query(VolunteerData)
                .filter(VolunteerData.id == UUID(volunteer_data_id))
                .first()
            )
            if not db_volunteer_data:
                raise HTTPException(status_code=404, detail="Volunteer data not found")

            self.db.delete(db_volunteer_data)
            self.db.commit()

        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid volunteer data ID format")
        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error deleting volunteer data {volunteer_data_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
