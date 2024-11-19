from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..schemas.auth import AuthResponse, LoginRequest
from ..services.implementations.auth_service import AuthService
from ..services.implementations.user_service import UserService
from ..utilities.db_utils import get_db
import logging

router = APIRouter(prefix="/auth", tags=["auth"])

def get_auth_service(db: Session = Depends(get_db)):
    logger = logging.getLogger(__name__)
    return AuthService(logger=logger, user_service=UserService(db))

@router.post("/login", response_model=AuthResponse)
async def login(
    credentials: LoginRequest, 
    auth_service: AuthService = Depends(get_auth_service)
):
    return auth_service.generate_token(credentials.email, credentials.password)