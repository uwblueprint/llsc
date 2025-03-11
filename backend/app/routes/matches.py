from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

# Import appropriate schemas
from app.schemas.match import MatchResponse, MatchCreate, MatchUpdate  # Create these
from backend.app.services.implementations.matches_service import MatchService
from app.utilities.db_utils import get_db

router = APIRouter(
    prefix="/matches",
    tags=["matches"],
)

def get_match_service(db: Session = Depends(get_db)):
    return MatchService(db)

@router.get("/", response_model=list[MatchResponse])
async def get_all_matches(
    match_service: MatchService = Depends(get_match_service)
):
    try:
        return await match_service.get_all_matches()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{match_id}", response_model=MatchResponse)
async def get_match(
    match_id: UUID,
    match_service: MatchService = Depends(get_match_service)
):
    try:
        match = await match_service.get_match(match_id)
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        return match
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{match_id}", status_code=204)
async def delete_match(
    match_id: UUID,
    match_service: MatchService = Depends(get_match_service)
):
    try:
        success = await match_service.delete_match(match_id)
        if not success:
            raise HTTPException(status_code=404, detail="Match not found")
        return None
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))