from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.middleware.auth import has_roles
from app.models import Experience, Quality, Treatment, User
from app.models.RankingPreference import RankingPreference
from app.schemas.user import UserRole
from app.services.implementations.ranking_service import RankingService
from app.services.implementations.user_service import UserService
from app.utilities.db_utils import get_db
from app.utilities.service_utils import get_user_service
from app.utilities.task_utils import create_volunteer_app_review_task


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
    user_service: UserService = Depends(get_user_service),
    authorized: bool = has_roles([UserRole.PARTICIPANT, UserRole.ADMIN]),
) -> None:
    try:
        service = RankingService(db)
        user_auth_id = request.state.user_id
        # Convert Pydantic models to dicts
        payload = [i.model_dump() for i in items]
        service.save_preferences(user_auth_id=user_auth_id, target=target, items=payload)

        # Create task for admin review
        try:
            user_id_str = await user_service.get_user_id_by_auth_id(user_auth_id)
            create_volunteer_app_review_task(db, user_id_str, "ranking")
        except Exception:
            # Log error but don't fail the request
            pass

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


class PreferenceItemWithName(BaseModel):
    kind: str
    id: int
    scope: str
    rank: int
    name: str


@router.get("/preferences/{user_id}", response_model=List[PreferenceItemWithName])
async def get_ranking_preferences(
    user_id: str,
    target: str = Query(..., pattern="^(patient|caregiver)$"),
    db: Session = Depends(get_db),
    authorized: bool = has_roles([UserRole.ADMIN]),
) -> List[PreferenceItemWithName]:
    """Get ranking preferences for a user (admin only)."""
    try:
        user_uuid = UUID(user_id)
        user = db.query(User).filter(User.id == user_uuid).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        preferences = (
            db.query(RankingPreference)
            .filter(RankingPreference.user_id == user_uuid, RankingPreference.target_role == target)
            .order_by(RankingPreference.rank)
            .all()
        )

        result = []
        for pref in preferences:
            item_id = None
            name = None
            if pref.kind == "quality" and pref.quality_id:
                item_id = pref.quality_id
                quality = db.query(Quality).filter(Quality.id == pref.quality_id).first()
                if quality:
                    name = quality.label
            elif pref.kind == "treatment" and pref.treatment_id:
                item_id = pref.treatment_id
                treatment = db.query(Treatment).filter(Treatment.id == pref.treatment_id).first()
                if treatment:
                    name = treatment.name
            elif pref.kind == "experience" and pref.experience_id:
                item_id = pref.experience_id
                experience = db.query(Experience).filter(Experience.id == pref.experience_id).first()
                if experience:
                    name = experience.name

            if item_id is not None and name:
                result.append(
                    PreferenceItemWithName(kind=pref.kind, id=item_id, scope=pref.scope, rank=pref.rank, name=name)
                )

        return result
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
