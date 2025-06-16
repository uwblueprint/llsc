from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.match import SubmitMatchRequest, SubmitMatchResponse
from app.services.implementations.match_service import MatchService
from app.utilities.db_utils import get_db

router = APIRouter(prefix="/matches", tags=["matches"])


def get_match_service(db: Session = Depends(get_db)) -> MatchService:
    return MatchService(db)


@router.post("/confirm-time", response_model=SubmitMatchResponse)
async def confirm_time(
    payload: SubmitMatchRequest,
    match_service: MatchService = Depends(get_match_service),
):
    try:
        confirmed_match = await match_service.submit_time(payload)
        return confirmed_match
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))
