import logging
from typing import List

import firebase_admin.auth
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.types import ASGIApp

from app.utilities.constants import LOGGER_NAME


class AuthMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, public_paths: List[str] = None):
        super().__init__(app)
        self.public_paths = public_paths or []
        self.logger = logging.getLogger(LOGGER_NAME("auth_middleware"))

    def is_public_path(self, path: str) -> bool:
        return path in self.public_paths

    async def dispatch(self, request: Request, call_next):
        if self.is_public_path(request.url.path):
            self.logger.info(f"Skipping auth for public path: {request.url.path}")
            return await call_next(request)

        # Get authentication token from header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            self.logger.warning(f"Missing or invalid auth header for {request.url.path}")
            return JSONResponse(status_code=401, content={"detail": "Authentication required"})

        token = auth_header.split(" ")[1]
        try:
            # Verify the token with Firebase
            self.logger.info(f"Verifying token for request to {request.url.path}")
            decoded_token = firebase_admin.auth.verify_id_token(token, check_revoked=True)

            # Get Firebase user information
            firebase_user = firebase_admin.auth.get_user(decoded_token["uid"])

            request.state.user_id = decoded_token["uid"]
            request.state.user_email = decoded_token.get("email")
            request.state.email_verified = firebase_user.email_verified
            request.state.user_claims = decoded_token.get("claims", {})

            # Add complete user info for convenience
            request.state.user_info = {
                "uid": decoded_token["uid"],
                "email": decoded_token.get("email"),
                "name": decoded_token.get("name", ""),
                "picture": decoded_token.get("picture", ""),
                "email_verified": firebase_user.email_verified,
            }

            response = await call_next(request)

            if isinstance(response, Response):
                response.headers["X-Auth-User-ID"] = decoded_token["uid"]

            return response

        except firebase_admin.auth.RevokedIdTokenError:
            self.logger.warning(f"Token has been revoked: {request.url.path}")
            return JSONResponse(
                status_code=401,
                content={"detail": "Token has been revoked. Please reauthenticate."},
            )
        except firebase_admin.auth.ExpiredIdTokenError:
            self.logger.warning(f"Token has expired: {request.url.path}")
            return JSONResponse(
                status_code=401,
                content={"detail": "Token has expired. Please reauthenticate."},
            )
        except firebase_admin.auth.InvalidIdTokenError as e:
            self.logger.warning(f"Invalid token: {request.url.path}, error: {str(e)}")
            return JSONResponse(status_code=401, content={"detail": "Invalid authentication token"})
        except Exception as e:
            self.logger.error(f"Authentication error for {request.url.path}: {str(e)}")
            return JSONResponse(status_code=401, content={"detail": f"Authentication failed: {str(e)}"})
