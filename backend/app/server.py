import logging
from contextlib import asynccontextmanager
from typing import Any, Dict, Union

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .middleware import AuthMiddleware
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
    "/test-middleware-public"
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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    AuthMiddleware,
    public_paths=PUBLIC_PATHS
)

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
    This will only work if you provide a valid Firebase token.
    """
    # Get all the attributes from request.state
    state_dict = {}
    for key in dir(request.state):
        # Skip private attributes and methods
        if not key.startswith("_") and not callable(getattr(request.state, key)):
            state_dict[key] = getattr(request.state, key)

    return {
        "message": "Middleware test - Auth required",
        "middleware_state": state_dict,
        "user_id": getattr(request.state, "user_id", None),
        "request_id": getattr(request.state, "request_id", None),
        "user_claims": getattr(request.state, "user_claims", None),
        "headers": dict(request.headers)
    }


@app.get("/test-middleware-public")
async def test_middleware_public(request: Request) -> Dict[str, Any]:
    """
    Public test endpoint that shows middleware-added state.
    This should work without authentication as it's in PUBLIC_PATHS.
    """
    # Get all the attributes from request.state
    state_dict = {}
    for key in dir(request.state):
        # Skip private attributes and methods
        if not key.startswith("_") and not callable(getattr(request.state, key)):
            state_dict[key] = getattr(request.state, key)

    return {
        "message": "Middleware test - Public",
        "middleware_state": state_dict,
        "request_id": getattr(request.state, "request_id", None),
        "headers": dict(request.headers)
    }
