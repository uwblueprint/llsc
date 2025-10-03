import logging

from alembic import command
from alembic.config import Config

from app.utilities.constants import LOGGER_NAME

from .AvailableTime import available_times

# Make sure all models are here to reflect all current models
# when autogenerating new migration
from .Base import Base
from .Experience import Experience
from .Form import Form
from .FormSubmission import FormSubmission
from .Match import Match
from .MatchStatus import MatchStatus
from .Quality import Quality
from .RankingPreference import RankingPreference
from .Role import Role
from .SuggestedTime import suggested_times
from .Task import Task, TaskPriority, TaskStatus, TaskType
from .TimeBlock import TimeBlock
from .Treatment import Treatment
from .User import FormStatus, User
from .UserData import UserData

# Used to avoid import errors for the models
__all__ = [
    "Base",
    "User",
    "Role",
    "TimeBlock",
    "Match",
    "MatchStatus",
    "User",
    "available_times",
    "suggested_times",
    "UserData",
    "Treatment",
    "Experience",
    "Quality",
    "RankingPreference",
    "Form",
    "FormSubmission",
    "FormStatus",
    "Task",
    "TaskType",
    "TaskPriority",
    "TaskStatus",
]

log = logging.getLogger(LOGGER_NAME("models"))


def run_migrations():
    log.info("Running run_migrations in models/__init__ on server startup")

    alembic_cfg = Config("alembic.ini")
    # Emulates `alembic upgrade head` to migrate up to latest revision
    command.upgrade(alembic_cfg, "head")
