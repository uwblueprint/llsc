import os
from sqlalchemy import create_engine
from dotenv import load_dotenv
load_dotenv()

from .Base import Base
from .User import User
from .Role import Role
__all__ = ["User", "Role"]

def init_app():
    engine = create_engine(os.environ["POSTGRES_DATABASE_URL"])
    Base.metadata.create_all(bind=engine)
