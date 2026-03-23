from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.middleware.auth import has_roles
from app.schemas.treatments_experience import TreatmentCreateRequest, TreatmentResponse
from app.schemas.user import UserRole
from app.services.implementations.treatment_service import TreatmentService
from app.utilities.db_utils import get_db

router = APIRouter(
    prefix="/treatments",
    tags=["treatments"],
)


def get_treatment_service(db: Session = Depends(get_db)):
    return TreatmentService(db)


@router.post("/", response_model=TreatmentResponse)
async def create_treatment(
    treatment: TreatmentCreateRequest,
    treatment_service: TreatmentService = Depends(get_treatment_service),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    """
    Create a new treatment (admin only).
    """
    try:
        return await treatment_service.create_treatment(treatment)
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
