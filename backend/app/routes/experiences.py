from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.middleware.auth import has_roles
from app.schemas.treatments_experience import ExperienceCreateRequest, ExperienceResponse
from app.schemas.user import UserRole
from app.services.implementations.experience_service import ExperienceService
from app.utilities.db_utils import get_db

router = APIRouter(
    prefix="/experiences",
    tags=["experiences"],
)


def get_experience_service(db: Session = Depends(get_db)):
    return ExperienceService(db)


@router.post("/", response_model=ExperienceResponse)
async def create_experience(
    experience: ExperienceCreateRequest,
    experience_service: ExperienceService = Depends(get_experience_service),
    authorized: bool = has_roles([UserRole.ADMIN]),
):
    """
    Create a new experience (admin only).
    """
    try:
        return await experience_service.create_experience(experience)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
