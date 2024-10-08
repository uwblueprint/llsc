import os

from dotenv import load_dotenv
from sqlalchemy import create_engine

from .Base import Base
from .Role import Role
from .User import User

load_dotenv()

__all__ = ["User", "Role"]


def init_app():
    engine = create_engine(os.environ["POSTGRES_DATABASE_URL"])
    Base.metadata.create_all(bind=engine)
