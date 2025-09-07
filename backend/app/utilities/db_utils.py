import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("POSTGRES_TEST_DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "POSTGRES_TEST_DATABASE_URL is not set. "
        "Set one of them to a valid Postgres URL, e.g. "
        "postgresql+psycopg2://postgres:postgres@db:5432/llsc_test"
    )
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# explanation for using yield to get local db session:
# https://stackoverflow.com/questions/64763770/why-we-use-yield-to-get-sessionlocal-in-fastapi-with-sqlalchemy
def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
