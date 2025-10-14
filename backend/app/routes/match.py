from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.middleware.auth import has_roles
from app.schemas.match import (
    MatchCreateRequest,
    MatchCreateResponse,
    MatchDetailResponse,
    MatchListResponse,
    MatchRequestNewTimesRequest,
    MatchRequestNewVolunteersRequest,
    MatchRequestNewVolunteersResponse,
    MatchResponse,
    MatchScheduleRequest,
    MatchUpdateRequest,
    SubmitMatchRequest,
    SubmitMatchResponse,
)
from app.schemas.task import TaskCreateRequest, TaskType
from app.schemas.user import UserRole
from app.services.implementations.match_service import MatchService
from app.services.implementations.task_service import TaskService
from app.services.implementations.user_service import UserService
from app.utilities.db_utils import get_db
from app.utilities.service_utils import get_task_service, get_user_service

router = APIRouter(prefix="/matches", tags=["matches"])


def get_match_service(db: Session = Depends(get_db)) -> MatchService:
    return MatchService(db)


@router.post("/", response_model=MatchCreateResponse)
async def create_matches(
    payload: MatchCreateRequest,
    match_service: MatchService = Depends(get_match_service),
    _authorized: bool = has_roles([UserRole.ADMIN]),
):
    try:
        return await match_service.create_matches(payload)
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{match_id}", response_model=MatchResponse)
async def update_match(
    match_id: int,
    payload: MatchUpdateRequest,
    match_service: MatchService = Depends(get_match_service),
    _authorized: bool = has_roles([UserRole.ADMIN]),
):
    try:
        return await match_service.update_match(match_id, payload)
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me", response_model=MatchListResponse)
async def get_my_matches(
    request: Request,
    match_service: MatchService = Depends(get_match_service),
    user_service: UserService = Depends(get_user_service),
    _authorized: bool = has_roles([UserRole.PARTICIPANT, UserRole.ADMIN]),
):
    try:
        auth_id = getattr(request.state, "user_id", None)
        if not auth_id:
            raise HTTPException(status_code=401, detail="Unauthorized")

        participant_id_str = await user_service.get_user_id_by_auth_id(auth_id)
        participant_id = UUID(participant_id_str)
        return await match_service.get_matches_for_participant(participant_id)
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/participant/{participant_id}", response_model=MatchListResponse)
async def get_matches_for_participant(
    participant_id: UUID,
    match_service: MatchService = Depends(get_match_service),
    _authorized: bool = has_roles([UserRole.ADMIN]),
):
    try:
        return await match_service.get_matches_for_participant(participant_id)
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{match_id}/schedule", response_model=MatchDetailResponse)
async def schedule_match(
    match_id: int,
    payload: MatchScheduleRequest,
    request: Request,
    match_service: MatchService = Depends(get_match_service),
    user_service: UserService = Depends(get_user_service),
    _authorized: bool = has_roles([UserRole.PARTICIPANT, UserRole.ADMIN]),
):
    try:
        acting_participant_id = await _resolve_acting_participant_id(request, user_service)
        return await match_service.schedule_match(match_id, payload.time_block_id, acting_participant_id)
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{match_id}/request-new-times", response_model=MatchDetailResponse)
async def request_new_times(
    match_id: int,
    payload: MatchRequestNewTimesRequest,
    request: Request,
    match_service: MatchService = Depends(get_match_service),
    user_service: UserService = Depends(get_user_service),
    _authorized: bool = has_roles([UserRole.PARTICIPANT, UserRole.ADMIN]),
):
    try:
        acting_participant_id = await _resolve_acting_participant_id(request, user_service)
        return await match_service.request_new_times(match_id, payload.suggested_new_times, acting_participant_id)
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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


@router.post("/{match_id}/cancel", response_model=MatchDetailResponse)
async def cancel_match_as_participant(
    match_id: int,
    request: Request,
    match_service: MatchService = Depends(get_match_service),
    user_service: UserService = Depends(get_user_service),
    _authorized: bool = has_roles([UserRole.PARTICIPANT, UserRole.ADMIN]),
):
    try:
        acting_participant_id = await _resolve_acting_participant_id(request, user_service)
        return await match_service.cancel_match_by_participant(match_id, acting_participant_id)
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{match_id}/cancel-volunteer", response_model=MatchDetailResponse)
async def cancel_match_as_volunteer(
    match_id: int,
    request: Request,
    match_service: MatchService = Depends(get_match_service),
    user_service: UserService = Depends(get_user_service),
    _authorized: bool = has_roles([UserRole.ADMIN, UserRole.VOLUNTEER]),
):
    try:
        acting_volunteer_id = await _resolve_acting_volunteer_id(request, user_service)
        return await match_service.cancel_match_by_volunteer(match_id, acting_volunteer_id)
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/request-new-volunteers", response_model=MatchRequestNewVolunteersResponse)
async def request_new_volunteers(
    request: Request,
    payload: MatchRequestNewVolunteersRequest,
    match_service: MatchService = Depends(get_match_service),
    user_service: UserService = Depends(get_user_service),
    task_service: TaskService = Depends(get_task_service),
    _authorized: bool = has_roles([UserRole.PARTICIPANT, UserRole.ADMIN]),
):
    try:
        participant_id = payload.participant_id

        if participant_id is None:
            participant_id = await _resolve_acting_participant_id(request, user_service)
            if not participant_id:
                raise HTTPException(status_code=400, detail="Participant identity required")
            response = await match_service.request_new_volunteers(participant_id, participant_id)
        else:
            acting_participant_id = await _resolve_acting_participant_id(request, user_service)
            response = await match_service.request_new_volunteers(participant_id, acting_participant_id)
        task_request = TaskCreateRequest(
            participant_id=participant_id,
            type=TaskType.MATCHING,
            description=payload.message,
        )
        await task_service.create_task(task_request)

        return response
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def _resolve_acting_participant_id(request: Request, user_service: UserService) -> Optional[UUID]:
    auth_id = getattr(request.state, "user_id", None)
    if not auth_id:
        return None

    try:
        role_name = user_service.get_user_role_by_auth_id(auth_id)
    except ValueError:
        return None

    if role_name != UserRole.PARTICIPANT.value:
        return None

    participant_id_str = await user_service.get_user_id_by_auth_id(auth_id)
    return UUID(participant_id_str)


async def _resolve_acting_volunteer_id(request: Request, user_service: UserService) -> Optional[UUID]:
    auth_id = getattr(request.state, "user_id", None)
    if not auth_id:
        return None

    try:
        role_name = user_service.get_user_role_by_auth_id(auth_id)
    except ValueError:
        return None

    if role_name != UserRole.VOLUNTEER.value:
        return None

    volunteer_id_str = await user_service.get_user_id_by_auth_id(auth_id)
    return UUID(volunteer_id_str)
