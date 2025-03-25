import logging
from contextlib import asynccontextmanager
from typing import Union

from dotenv import load_dotenv
from fastapi import FastAPI

from . import models
from .routes import send_email, user, suggested_times, availability
from .utilities.constants import LOGGER_NAME
from .utilities.firebase_init import initialize_firebase
# from .utilities.ses.ses_init import ensure_ses_templates

load_dotenv()

log = logging.getLogger(LOGGER_NAME("server"))


@asynccontextmanager
async def lifespan(_: FastAPI):
    log.info("Starting up...")
    # ensure_ses_templates()
    models.run_migrations()
    initialize_firebase()
    yield
    log.info("Shutting down...")


# Source: https://stackoverflow.com/questions/77170361/
# running-alembic-migrations-on-fastapi-startup
app = FastAPI(lifespan=lifespan)
app.include_router(user.router)
app.include_router(availability.router)
app.include_router(suggested_times.router)
# app.include_router(send_email.router)



@app.get("/")
def read_root():
    log.info("Hello World")
    return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}
