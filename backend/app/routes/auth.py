from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from ..models.User import User
from ..schemas.auth import AuthResponse, LoginRequest, RefreshRequest, Token
from ..schemas.user import UserCreateRequest, UserCreateResponse, UserRole
from ..services.implementations.auth_service import AuthService
from ..services.implementations.user_service import UserService
from ..utilities.db_utils import get_db
from ..utilities.service_utils import get_auth_service, get_user_service

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()


# TODO: ADD RATE LIMITING
@router.post("/register", response_model=UserCreateResponse)
async def register_user(user: UserCreateRequest, user_service: UserService = Depends(get_user_service)):
    allowed_Admins = ["umair.hkar@gmail.com", "umairmhundekar@gmail.com"]
    if user.role == UserRole.ADMIN:
        if user.email not in allowed_Admins:
            raise HTTPException(status_code=403, detail="Access denied. Admin privileges required for admin portal")

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
        auth_response = auth_service.generate_token(credentials.email, credentials.password)
        if is_admin_portal and not auth_service.is_authorized_by_role(auth_response.access_token, {UserRole.ADMIN}):
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
async def refresh(refresh_data: RefreshRequest, auth_service: AuthService = Depends(get_auth_service)):
    try:
        return auth_service.renew_token(refresh_data.refresh_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/resetPassword/{email}")
async def reset_password(email: str, auth_service: AuthService = Depends(get_auth_service)):
    try:
        auth_service.reset_password(email)
        # Return 204 No Content for successful password reset email sending
        return Response(status_code=204)
    except Exception:
        # Don't reveal if email exists or not for security reasons
        # Always return success even if email doesn't exist
        return Response(status_code=204)


@router.post("/verify/{email}")
async def verify_email(email: str, auth_service: AuthService = Depends(get_auth_service)):
    try:
        auth_service.verify_email(email)
        return Response(status_code=200)
    except ValueError as e:
        # Log the error for debugging but don't expose it to the client
        print(f"Email verification failed for {email}: {str(e)}")
        # Return 404 for user not found instead of 400
        return Response(status_code=404)
    except Exception as e:
        # Log unexpected errors
        print(f"Unexpected error during email verification for {email}: {str(e)}")
        return Response(status_code=500)


@router.post("/send-email-verification/{email}")
async def send_email_verification(email: str, auth_service: AuthService = Depends(get_auth_service)):
    try:
        auth_service.send_email_verification_link(email)
        return Response(status_code=204)
    except Exception:
        # Don't reveal if email exists or not for security reasons
        # Always return success even if email doesn't exist
        return Response(status_code=204)


@router.get("/me", response_model=UserCreateResponse)
async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """Get current authenticated user information including role"""
    try:
        # Get user auth_id from request state (set by auth middleware)
        user_auth_id = request.state.user_id
        if not user_auth_id:
            raise HTTPException(status_code=401, detail="Authentication required")

        # Query user from database
        user = db.query(User).filter(User.auth_id == user_auth_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return UserCreateResponse(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            role_id=user.role_id,
            auth_id=user.auth_id,
            approved=user.approved,
            form_status=user.form_status,
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting current user: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
