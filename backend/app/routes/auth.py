from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ..middleware.auth import UserRole
from ..schemas.auth import AuthResponse, LoginRequest, RefreshRequest, Token
from ..schemas.user import UserCreateRequest, UserCreateResponse
from ..services.implementations.auth_service import AuthService
from ..services.implementations.user_service import UserService
from ..utilities.service_utils import get_auth_service, get_user_service

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()


# TODO: ADD RATE LIMITING
@router.post("/register", response_model=UserCreateResponse)
async def register_user(
    user: UserCreateRequest, user_service: UserService = Depends(get_user_service)
):
    try:
        return await user_service.create_user(user)
    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login", response_model=AuthResponse)
async def login(
    request: Request,
    credentials: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    try:
        is_admin_portal = request.headers.get("X-Admin-Portal") == "true"
        auth_response = auth_service.generate_token(
            credentials.email, credentials.password
        )
        if is_admin_portal and not auth_service.is_authorized_by_role(
            auth_response.access_token, {UserRole.ADMIN}
        ):
            raise HTTPException(
                status_code=403,
                detail="Access denied. Admin privileges required for admin portal",
            )

        return auth_response

    except HTTPException as http_ex:
        raise http_ex
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/logout")
async def logout(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service),
):
    try:
        user_id = request.state.user_id
        if not user_id:
            raise HTTPException(status_code=401, detail="Authentication required")

        auth_service.revoke_tokens(user_id)
        return {"message": "Successfully logged out"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/refresh", response_model=Token)
async def refresh(
    refresh_data: RefreshRequest, auth_service: AuthService = Depends(get_auth_service)
):
    try:
        return auth_service.renew_token(refresh_data.refresh_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
