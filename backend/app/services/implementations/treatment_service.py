import logging

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Treatment
from app.schemas.treatments_experience import TreatmentCreateRequest, TreatmentResponse
from app.utilities.constants import LOGGER_NAME


class TreatmentService:
    def __init__(self, db: Session):
        self.db = db
        self.logger = logging.getLogger(LOGGER_NAME("treatment_service"))

    async def create_treatment(self, treatment: TreatmentCreateRequest) -> TreatmentResponse:
        """
        Create a new treatment in the database
        """
        name = treatment.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Treatment name cannot be empty")

        # Check for existing treatment before insert (handles duplicates and avoids IntegrityError)
        existing = self.db.query(Treatment).filter(Treatment.name == name).first()
        if existing:
            raise HTTPException(status_code=400, detail="Treatment with this name already exists")

        try:
            db_treatment = Treatment(name=name)
            self.db.add(db_treatment)
            self.db.commit()
            self.db.refresh(db_treatment)

            self.logger.info(f"Created treatment {db_treatment.id} of name {name}")
            return TreatmentResponse.model_validate(db_treatment)

        except HTTPException:
            raise
        except IntegrityError as e:
            self.db.rollback()
            self.logger.warning(f"IntegrityError creating treatment '{name}': {e}")
            raise HTTPException(status_code=400, detail="Treatment with this name already exists")
        except Exception as e:
            self.db.rollback()
            self.logger.error(f"Error creating treatment: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))