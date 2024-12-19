import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("POSTGRES_DATABASE_URL")
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
