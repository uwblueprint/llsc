import os

from sqlalchemy import create_engine

# Make sure all models are here to reflect all current models
# when autogenerating new migration
from .Base import Base
from .Role import Role
from .User import User

# Used to avoid import errors for the models
__all__ = ["Base", "User", "Role"]


def create_tables():
    engine = create_engine(os.getenv("POSTGRES_DATABASE_URL"))
    Base.metadata.create_all(bind=engine)
