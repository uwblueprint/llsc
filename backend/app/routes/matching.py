from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.matching import RelevantUsersResponse
from app.services.implementations.matching_service import MatchingService
from app.utilities.db_utils import get_db

router = APIRouter(
    prefix="/matching",
    tags=["matching"],
)


def get_matching_service(db: Session = Depends(get_db)):
    return MatchingService(db)


@router.get("/{user_id}", response_model=RelevantUsersResponse)
async def get_matches(user_id: UUID, matching_service: MatchingService = Depends(get_matching_service)):
    """
    Get potential user matches based on the user's profile.
    """
    try:
        matched_data = await matching_service.get_matches(user_id)
        return RelevantUsersResponse(matches=matched_data)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
