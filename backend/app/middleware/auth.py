import logging
from typing import List, Dict, Any

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from ..utilities.constants import LOGGER_NAME
from ..utilities.service_utils import get_auth_service

security = HTTPBearer()
logger = logging.getLogger(LOGGER_NAME("auth"))


def has_roles(required_roles: List[str]):
    """
    FastAPI dependency that checks if the authenticated user has one of the required roles.
    
    Args:
        required_roles: List of roles that can access the endpoint
        
    Returns:
        A dependency that validates the user has one of the specified roles
    
    Example:
        @app.get("/admin-only")
        async def admin_endpoint(authorized: bool = has_roles(["admin"])):
            return {"message": "You have admin access"}
    """
    async def role_validator(
        request: Request,
        credentials: HTTPAuthorizationCredentials = Depends(security),
        auth_service = Depends(get_auth_service)
    ) -> bool:
        # Get the token from authorization header
        token = credentials.credentials
        
        # Use the auth service to check if the user has the required role
        is_authorized = auth_service.is_authorized_by_role(token, set(required_roles))
        
        if not is_authorized:
            logger.warning(f"Access denied: user doesn't have required roles: {required_roles}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: requires one of these roles: {required_roles}"
            )
        
        return True
    
    return Depends(role_validator) 