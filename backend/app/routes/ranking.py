from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.middleware.auth import has_roles
from app.schemas.user import UserRole
from app.services.implementations.ranking_service import RankingService
from app.utilities.db_utils import get_db


class StaticQualityOption(BaseModel):
    quality_id: int
    slug: str
    label: str
    allowed_scopes: List[str] | None = Field(default=None, description="Optional whitelisted scopes for this quality")


class DynamicOption(BaseModel):
    kind: str  # 'treatment' | 'experience'
    id: int
    name: str
    scope: str  # 'self' | 'loved_one'


class RankingOptionsResponse(BaseModel):
    static_qualities: List[StaticQualityOption]
    dynamic_options: List[DynamicOption]


router = APIRouter(prefix="/ranking", tags=["ranking"])


@router.get("/options", response_model=RankingOptionsResponse)
async def get_ranking_options(
    request: Request,
    target: str = Query(..., pattern="^(patient|caregiver)$"),
    db: Session = Depends(get_db),
    authorized: bool = has_roles([UserRole.PARTICIPANT, UserRole.ADMIN]),
) -> RankingOptionsResponse:
    try:
        service = RankingService(db)
        user_auth_id = request.state.user_id
        options = service.get_options(user_auth_id=user_auth_id, target=target)
        return RankingOptionsResponse(**options)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class PreferenceItem(BaseModel):
    kind: str  # 'quality' | 'treatment' | 'experience'
    id: int
    scope: str  # 'self' | 'loved_one'
    rank: int


@router.put("/preferences", status_code=204)
async def put_ranking_preferences(
    request: Request,
    target: str = Query(..., pattern="^(patient|caregiver)$"),
    items: List[PreferenceItem] = [],
    db: Session = Depends(get_db),
    authorized: bool = has_roles([UserRole.PARTICIPANT, UserRole.ADMIN]),
) -> None:
    try:
        service = RankingService(db)
        user_auth_id = request.state.user_id
        # Convert Pydantic models to dicts
        payload = [i.model_dump() for i in items]
        service.save_preferences(user_auth_id=user_auth_id, target=target, items=payload)
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class CaseResponse(BaseModel):
    case: str
    has_blood_cancer: str | None = None
    caring_for_someone: str | None = None


@router.get("/case", response_model=CaseResponse)
async def get_participant_case(
    request: Request,
    db: Session = Depends(get_db),
    authorized: bool = has_roles([UserRole.PARTICIPANT, UserRole.ADMIN]),
) -> CaseResponse:
    try:
        service = RankingService(db)
        user_auth_id = request.state.user_id
        result = service.get_case(user_auth_id)
        return CaseResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/options", response_model=RankingOptionsResponse)
async def get_ranking_options_admin(
    user_id: str = Query(..., description="User ID (UUID) to fetch options for"),
    target: str = Query(..., pattern="^(patient|caregiver)$"),
    db: Session = Depends(get_db),
    authorized: bool = has_roles([UserRole.ADMIN]),
) -> RankingOptionsResponse:
    """Admin endpoint to get ranking options for a specific user."""
    try:
        service = RankingService(db)
        options = service.get_options_for_user_id(user_id=user_id, target=target)
        return RankingOptionsResponse(**options)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
