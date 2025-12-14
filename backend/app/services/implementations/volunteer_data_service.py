import logging
from typing import List
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.interfaces.volunteer_data_service import IVolunteerDataService
from app.models import Form, FormSubmission
from app.models.User import User
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

    async def create_volunteer_data(self, volunteer_data: VolunteerDataCreateRequest) -> VolunteerDataResponse:
        """
        Create a form_submission for secondary application with pending_approval status.
        NOTE: VolunteerData is NOT created here - it's created when admin approves the form.
        Returns a placeholder response with the submitted data.
        """
        try:
            user_id = volunteer_data.user_id

            if user_id is None:
                raise HTTPException(status_code=400, detail="user_id is required")

            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            # NOTE: We no longer create VolunteerData here.
            # That happens when admin approves the form submission.

            # NOTE: We no longer update user.form_status here.
            # That happens when admin approves the form submission.

            # Create form_submission record for secondary application form
            secondary_app_form = (
                self.db.query(Form)
                .filter(
                    Form.type == "secondary",
                    Form.name == "Secondary Application Form",
                )
                .first()
            )
            if not secondary_app_form:
                raise HTTPException(status_code=500, detail="Secondary Application Form not found in database")

            # Check if submission already exists
            existing_submission = (
                self.db.query(FormSubmission)
                .filter(FormSubmission.user_id == user_id, FormSubmission.form_id == secondary_app_form.id)
                .first()
            )

            # Build answers dict from volunteer data
            answers = {
                "experience": volunteer_data.experience,
                "references_json": volunteer_data.references_json,
                "additional_comments": volunteer_data.additional_comments,
            }

            if existing_submission:
                # Update existing submission and reset to pending
                existing_submission.answers = answers
                existing_submission.status = "pending_approval"
            else:
                # Create new submission with pending status
                new_submission = FormSubmission(
                    form_id=secondary_app_form.id,
                    user_id=user_id,
                    answers=answers,
                    status="pending_approval",
                )
                self.db.add(new_submission)

            self.db.commit()

            # Return placeholder response (no actual VolunteerData created yet)
            # The id will be None since we haven't created the record
            return VolunteerDataResponse(
                id=None,
                user_id=user_id,
                experience=volunteer_data.experience,
                references_json=volunteer_data.references_json,
                additional_comments=volunteer_data.additional_comments,
            )

        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error creating volunteer data submission: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    def process_volunteer_data(self, user_id: UUID, answers: dict) -> VolunteerData:
        """
        Internal method to actually create VolunteerData record.
        Called by FormProcessor when admin approves a secondary application form.
        """
        # Check if volunteer data already exists for this user
        existing_data = self.db.query(VolunteerData).filter(VolunteerData.user_id == user_id).first()
        if existing_data:
            # Update existing record
            existing_data.experience = answers.get("experience")
            existing_data.references_json = answers.get("references_json")
            existing_data.additional_comments = answers.get("additional_comments")
            return existing_data

        # Create new volunteer data entry
        db_volunteer_data = VolunteerData(
            user_id=user_id,
            experience=answers.get("experience"),
            references_json=answers.get("references_json"),
            additional_comments=answers.get("additional_comments"),
        )
        self.db.add(db_volunteer_data)
        return db_volunteer_data

    async def get_volunteer_data_by_id(self, volunteer_data_id: str) -> VolunteerDataResponse:
        try:
            volunteer_data = self.db.query(VolunteerData).filter(VolunteerData.id == UUID(volunteer_data_id)).first()
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
            volunteer_data = self.db.query(VolunteerData).filter(VolunteerData.user_id == UUID(user_id)).first()
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
            db_volunteer_data = self.db.query(VolunteerData).filter(VolunteerData.id == UUID(volunteer_data_id)).first()
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
            db_volunteer_data = self.db.query(VolunteerData).filter(VolunteerData.id == UUID(volunteer_data_id)).first()
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
