import uuid
from sqlalchemy import Column, String, Integer, Enum
from sqlalchemy.dialects.postgresql import UUID

from .Base import Base


class Form(Base):
    __tablename__ = "forms"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)  # 'Intake - Participant Caregiver'
    version = Column(Integer, default=1, nullable=False)
    type = Column(Enum(
        "intake", 
        "ranking", 
        "secondary",
        "become_volunteer", 
        "become_participant",
        name="form_type"
    ), nullable=False) 
