from sqlalchemy.orm import sessionmaker, Session
from app.models import Base

# Create a SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=Base.metadata.bind)

def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()