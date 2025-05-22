import logging
from contextlib import asynccontextmanager
from typing import Any, Dict, Union

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .middleware.auth_middleware import AuthMiddleware
from .routes import auth, send_email, user
from .utilities.constants import LOGGER_NAME
from .utilities.firebase_init import initialize_firebase

load_dotenv()


log = logging.getLogger(LOGGER_NAME("server"))

PUBLIC_PATHS = [
    "/",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/auth/login",
    "/auth/register",
    "/health",
    "/test-middleware-public",
    "/email/send-test-email",
]


@asynccontextmanager
async def lifespan(_: FastAPI):
    log.info("Starting up...")
    models.run_migrations()
    initialize_firebase()
    yield
    log.info("Shutting down...")


# Source: https://stackoverflow.com/questions/77170361/
# running-alembic-migrations-on-fastapi-startup
app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://uw-blueprint-starter-code.firebaseapp.com",
        "https://uw-blueprint-starter-code.web.app",
        # TODO: create a separate middleware function to dynamically
        # determine this value
        # re.compile("^https:\/\/uw-blueprint-starter-code--pr.*\.web\.app$"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(AuthMiddleware, public_paths=PUBLIC_PATHS)
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(send_email.router)


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}


@app.get("/test-middleware")
async def test_middleware(request: Request) -> Dict[str, Any]:
    """
    Test endpoint that requires authentication and shows middleware-added state.
    This will only work if you provide a valid Firebase token in the Authorization header.

    Example: Authorization: Bearer your-firebase-token

    The response will show all user information added by the Firebase auth middleware.
    """
    # Get all the attributes from request.state
    state_dict = {}
    for key in dir(request.state):
        # Skip private attributes and methods
        if not key.startswith("_") and not callable(getattr(request.state, key)):
            state_dict[key] = getattr(request.state, key)

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


@app.get("/test-middleware-public")
async def test_middleware_public(request: Request) -> Dict[str, Any]:
    """
    Public test endpoint that shows middleware-added state.
    This endpoint is in PUBLIC_PATHS, so it works without authentication.
    No Firebase token is required to access this endpoint.
    """
    # Get all the attributes from request.state
    state_dict = {}
    for key in dir(request.state):
        # Skip private attributes and methods
        if not key.startswith("_") and not callable(getattr(request.state, key)):
            state_dict[key] = getattr(request.state, key)

    # Check if any auth header was provided (optional for this endpoint)
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


# Role-based access test endpoints
from .middleware.auth import has_roles
from .schemas.user import UserRole


@app.get("/test-role-admin")
async def test_role_admin(
    request: Request, authorized: bool = has_roles([UserRole.ADMIN])
) -> Dict[str, Any]:
    """
    Test endpoint that requires the Admin role.

    This demonstrates role-based access control using the has_roles dependency.
    Only users with the Admin role can access this endpoint.
    """
    return {
        "message": "You have successfully accessed an admin-only endpoint",
        "user_id": request.state.user_id,
        "user_email": request.state.user_email,
        "role": "admin",
    }


@app.get("/test-role-volunteer")
async def test_role_volunteer(
    request: Request, authorized: bool = has_roles([UserRole.VOLUNTEER])
) -> Dict[str, Any]:
    """
    Test endpoint that requires the Volunteer role.

    This demonstrates role-based access control using the has_roles dependency.
    Only users with the Volunteer role can access this endpoint.
    """
    return {
        "message": "You have successfully accessed a volunteer-only endpoint",
        "user_id": request.state.user_id,
        "user_email": request.state.user_email,
        "role": "volunteer",
    }


@app.get("/test-role-participant")
async def test_role_participant(
    request: Request, authorized: bool = has_roles([UserRole.PARTICIPANT])
) -> Dict[str, Any]:
    """
    Test endpoint that requires the Participant role.

    This demonstrates role-based access control using the has_roles dependency.
    Only users with the Participant role can access this endpoint.
    """
    return {
        "message": "You have successfully accessed a participant-only endpoint",
        "user_id": request.state.user_id,
        "user_email": request.state.user_email,
        "role": "participant",
    }


@app.get("/test-role-multiple")
async def test_role_multiple(
    request: Request, authorized: bool = has_roles([UserRole.ADMIN, UserRole.VOLUNTEER])
) -> Dict[str, Any]:
    """
    Test endpoint that requires either Admin OR Volunteer role.

    This demonstrates role-based access control with multiple allowed roles.
    Users with either Admin or Volunteer roles can access this endpoint.
    """
    return {
        "message": "You have successfully accessed an endpoint requiring admin OR volunteer role",
        "user_id": request.state.user_id,
        "user_email": request.state.user_email,
        "roles_allowed": ["admin", "volunteer"],
    }
