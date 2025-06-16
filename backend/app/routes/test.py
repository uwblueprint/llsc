from typing import Any, Dict

from fastapi import APIRouter, Request

from ..middleware.auth import has_roles
from ..schemas.user import UserRole

router = APIRouter(prefix="/test", tags=["test"])


@router.get("/middleware")
async def test_middleware(request: Request) -> Dict[str, Any]:
    state_dict = {
        key: getattr(request.state, key)
        for key in dir(request.state)
        if not key.startswith("_") and not callable(getattr(request.state, key))
    }

    return {
        "message": "Authentication successful! User info from Firebase token:",
        "middleware_state": state_dict,
        "user_id": getattr(request.state, "user_id", None),
        "user_email": getattr(request.state, "user_email", None),
        "email_verified": getattr(request.state, "email_verified", None),
        "user_claims": getattr(request.state, "user_claims", None),
        "user_info": getattr(request.state, "user_info", None),
        "request_id": getattr(request.state, "request_id", None),
        "authorization_header": request.headers.get("Authorization", "Not provided"),
    }


@router.get("/middleware-public")
async def test_middleware_public(request: Request) -> Dict[str, Any]:
    state_dict = {
        key: getattr(request.state, key)
        for key in dir(request.state)
        if not key.startswith("_") and not callable(getattr(request.state, key))
    }

    auth_header = request.headers.get("Authorization")
    auth_message = "No authentication required for this endpoint"
    if auth_header:
        auth_message += " (but you provided an auth header anyway)"

    return {
        "message": "Public endpoint - No authentication required",
        "auth_status": auth_message,
        "middleware_state": state_dict,
        "request_id": getattr(request.state, "request_id", None),
        "authorization_header": request.headers.get("Authorization", "Not provided"),
    }


@router.get("/role-admin")
async def test_role_admin(request: Request, authorized: bool = has_roles([UserRole.ADMIN])) -> Dict[str, Any]:
    return {
        "message": "Successfully accessed an admin-only endpoint",
        "user_id": request.state.user_id,
        "user_email": request.state.user_email,
        "role": "admin",
    }


@router.get("/role-volunteer")
async def test_role_volunteer(request: Request, authorized: bool = has_roles([UserRole.VOLUNTEER])) -> Dict[str, Any]:
    return {
        "message": "Successfully accessed a volunteer-only endpoint",
        "user_id": request.state.user_id,
        "user_email": request.state.user_email,
        "role": "volunteer",
    }


@router.get("/role-participant")
async def test_role_participant(
    request: Request, authorized: bool = has_roles([UserRole.PARTICIPANT])
) -> Dict[str, Any]:
    return {
        "message": "Successfully accessed a participant-only endpoint",
        "user_id": request.state.user_id,
        "user_email": request.state.user_email,
        "role": "participant",
    }


@router.get("/role-multiple")
async def test_role_multiple(
    request: Request, authorized: bool = has_roles([UserRole.ADMIN, UserRole.VOLUNTEER])
) -> Dict[str, Any]:
    return {
        "message": "Successfully accessed an admin or volunteer endpoint",
        "user_id": request.state.user_id,
        "user_email": request.state.user_email,
        "roles_allowed": ["admin", "volunteer"],
    }
