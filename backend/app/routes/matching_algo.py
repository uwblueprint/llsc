from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from uuid import UUID

from app.schemas.matching.relevant_users_response import RelevantUsersResponse
from app.services.implementations.matching_algo_service import MatchingAlgoService
from app.utilities.db_utils import get_db

router = APIRouter(
    prefix="/matching_algo",
    tags=["matching_algo"],
)

def get_matching_service(db: Session = Depends(get_db)):
    return MatchingAlgoService(db)

@router.get("/{user_id}", response_model=RelevantUsersResponse)
async def get_matches(
    user_id: UUID,
    matching_service: MatchingAlgoService = Depends(get_matching_service)
):
    """
    Get potential user matches based on the user's profile.
    """
    try:
        matched_users = await matching_service.get_matches(user_id)
        return RelevantUsersResponse(users=matched_users)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))