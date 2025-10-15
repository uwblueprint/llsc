import pytest
from fastapi import HTTPException
from starlette.requests import Request

from app.routes.match import _resolve_acting_participant_id, _resolve_acting_volunteer_id
from app.schemas.user import UserRole


class DummyUserService:
    def __init__(self, role_map, id_map):
        self.role_map = role_map
        self.id_map = id_map

    def get_user_role_by_auth_id(self, auth_id: str) -> str:
        if auth_id not in self.role_map:
            raise ValueError("User not found")
        return self.role_map[auth_id]

    async def get_user_id_by_auth_id(self, auth_id: str) -> str:
        if auth_id not in self.id_map:
            raise ValueError("ID not found")
        return self.id_map[auth_id]


@pytest.mark.asyncio
async def test_resolve_participant_success():
    request = Request({"type": "http"})
    request.state.user_id = "auth_participant"

    service = DummyUserService(
        role_map={"auth_participant": UserRole.PARTICIPANT.value},
        id_map={"auth_participant": "11111111-1111-1111-1111-111111111111"},
    )

    participant_id = await _resolve_acting_participant_id(request, service)
    assert str(participant_id) == "11111111-1111-1111-1111-111111111111"


@pytest.mark.asyncio
async def test_resolve_participant_admin_bypass():
    request = Request({"type": "http"})
    request.state.user_id = "auth_admin"

    service = DummyUserService(
        role_map={"auth_admin": UserRole.ADMIN.value},
        id_map={},
    )

    participant_id = await _resolve_acting_participant_id(request, service)
    assert participant_id is None


@pytest.mark.asyncio
async def test_resolve_participant_missing_user_raises():
    request = Request({"type": "http"})
    request.state.user_id = "auth_unknown"

    service = DummyUserService(role_map={}, id_map={})

    with pytest.raises(HTTPException) as exc:
        await _resolve_acting_participant_id(request, service)

    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_resolve_participant_wrong_role_raises():
    request = Request({"type": "http"})
    request.state.user_id = "auth_volunteer"

    service = DummyUserService(
        role_map={"auth_volunteer": UserRole.VOLUNTEER.value},
        id_map={},
    )

    with pytest.raises(HTTPException) as exc:
        await _resolve_acting_participant_id(request, service)

    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_resolve_volunteer_success():
    request = Request({"type": "http"})
    request.state.user_id = "auth_volunteer"

    service = DummyUserService(
        role_map={"auth_volunteer": UserRole.VOLUNTEER.value},
        id_map={"auth_volunteer": "22222222-2222-2222-2222-222222222222"},
    )

    volunteer_id = await _resolve_acting_volunteer_id(request, service)
    assert str(volunteer_id) == "22222222-2222-2222-2222-222222222222"


@pytest.mark.asyncio
async def test_resolve_volunteer_missing_user_raises():
    request = Request({"type": "http"})
    request.state.user_id = "auth_missing"

    service = DummyUserService(role_map={}, id_map={})

    with pytest.raises(HTTPException) as exc:
        await _resolve_acting_volunteer_id(request, service)

    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_resolve_volunteer_wrong_role_raises():
    request = Request({"type": "http"})
    request.state.user_id = "auth_participant"

    service = DummyUserService(
        role_map={"auth_participant": UserRole.PARTICIPANT.value},
        id_map={},
    )

    with pytest.raises(HTTPException) as exc:
        await _resolve_acting_volunteer_id(request, service)

    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_resolve_volunteer_admin_bypass():
    request = Request({"type": "http"})
    request.state.user_id = "auth_admin"

    service = DummyUserService(
        role_map={"auth_admin": UserRole.ADMIN.value},
        id_map={},
    )

    volunteer_id = await _resolve_acting_volunteer_id(request, service)
    assert volunteer_id is None
