import logging
from contextlib import asynccontextmanager
from typing import Union

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .middleware.auth_middleware import AuthMiddleware
from .routes import auth, availability, match, send_email, suggested_times, test, user, user_data
from .utilities.constants import LOGGER_NAME
from .utilities.firebase_init import initialize_firebase
from .utilities.ses.ses_init import ensure_ses_templates

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
    ensure_ses_templates()
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
app.include_router(user_data.router)
app.include_router(availability.router)
app.include_router(suggested_times.router)
app.include_router(match.router)
app.include_router(send_email.router)
app.include_router(test.router)


@app.get("/")
def read_root():
    log.info("Hello World")
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}
