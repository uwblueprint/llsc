import logging

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Experience
from app.schemas.treatments_experience import ExperienceCreateRequest, ExperienceResponse
from app.utilities.constants import LOGGER_NAME


class ExperienceService:
    def __init__(self, db: Session):
        self.db = db
        self.logger = logging.getLogger(LOGGER_NAME("experience_service"))

    async def create_experience(self, experience: ExperienceCreateRequest) -> ExperienceResponse:
        """
        Create a new experience in the database
        """
        try:
            db_experience = Experience(
                name=experience.name,
                scope=experience.scope,
            )

            self.db.add(db_experience)
            self.db.commit()
            self.db.refresh(db_experience)

            self.logger.info(f"Created experience {db_experience.id} of name {experience.name}")
            return ExperienceResponse.model_validate(db_experience)

        except HTTPException:
            raise
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=400, detail="Experience with this name already exists")
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error creating experience: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))