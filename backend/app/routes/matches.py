from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.schemas.match import MatchCreateRequest, MatchUpdateRequest, MatchResponse
from app.services.matching_service import MatchingService
from app.utilities.db_utils import get_db

router = APIRouter(
    prefix="/matches",
    tags=["matches"],
)


# Dependency to inject the MatchingService
def get_matching_service(db: Session = Depends(get_db)):
    return MatchingService(db)


@router.post("/", response_model=MatchResponse, status_code=status.HTTP_201_CREATED)
async def create_match(
    match_data: MatchCreateRequest, matching_service: MatchingService = Depends(get_matching_service)
):
    """
    Creates a new match between two users.
    """
    try:
        return await matching_service.create_match(match_data)
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{match_id}", response_model=MatchResponse)
async def get_match(
    match_id: UUID, matching_service: MatchingService = Depends(get_matching_service)
):
    """
    Fetches a match by its UUID.
    """
    pass


@router.put("/{match_id}", response_model=MatchResponse)
async def update_match(
    match_id: UUID, match_data: MatchUpdateRequest, matching_service: MatchingService = Depends(get_matching_service)
):
    """
    Updates an existing match.
    """
    try:
        return await matching_service.update_match(match_id, match_data)
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{match_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_match(
    match_id: UUID, matching_service: MatchingService = Depends(get_matching_service)
):
    """
    Deletes a match by its UUID.
    """
   pass