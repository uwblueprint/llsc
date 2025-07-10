import logging

from alembic import command
from alembic.config import Config

from app.utilities.constants import LOGGER_NAME

from .AvailableTime import available_times

# Make sure all models are here to reflect all current models
# when autogenerating new migration
from .Base import Base
from .Match import Match
from .MatchStatus import MatchStatus
from .Role import Role
from .SuggestedTime import suggested_times
from .TimeBlock import TimeBlock
from .User import User
from .UserData import UserData

# Used to avoid import errors for the models
__all__ = [
    "Base",
    "User",
    "Role",
    "UserData",
    "TimeBlock",
    "Match",
    "MatchStatus",
    "available_times",
    "suggested_times",
]

log = logging.getLogger(LOGGER_NAME("models"))


def run_migrations():
    log.info("Running run_migrations in models/__init__ on server startup")

    alembic_cfg = Config("alembic.ini")
    # Emulates `alembic upgrade head` to migrate up to latest revision
    command.upgrade(alembic_cfg, "head")
