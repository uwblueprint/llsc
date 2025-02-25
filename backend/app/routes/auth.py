from fastapi import APIRouter, Depends, HTTPException, Security, Body, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from ..schemas.auth import AuthResponse, LoginRequest, Token, RefreshRequest
from ..services.implementations.auth_service import AuthService
from ..services.implementations.user_service import UserService
from ..utilities.db_utils import get_db
from ..utilities.service_utils import get_auth_service
import logging

from ..schemas.user import UserRole

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()

@router.post("/login", response_model=AuthResponse)
async def login(
    credentials: LoginRequest, 
    auth_service: AuthService = Depends(get_auth_service)
):
    return auth_service.generate_token(credentials.email, credentials.password)

@router.post("/logout")
async def logout(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
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
    refresh_data: RefreshRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    try:
        return auth_service.renew_token(refresh_data.refresh_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
    