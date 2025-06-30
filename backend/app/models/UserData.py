import uuid
from sqlalchemy import Column, Date, String, Table, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .Base import Base

# Bridge tables for many-to-many relationships
user_treatments = Table(
    "user_treatments",
    Base.metadata,
    Column("user_data_id", UUID(as_uuid=True), ForeignKey("user_data.id")),
    Column("treatment_id", Integer, ForeignKey("treatments.id"))
)

user_experiences = Table(
    "user_experiences", 
    Base.metadata,
    Column("user_data_id", UUID(as_uuid=True), ForeignKey("user_data.id")),
    Column("experience_id", Integer, ForeignKey("experiences.id"))
)


class UserData(Base):
    __tablename__ = "user_data"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Single-valued fields
    date_of_birth = Column(Date, nullable=True)
    email = Column(String(120), nullable=True)
    phone = Column(String(20), nullable=True)
    
    # Many-to-many relationships
    treatments = relationship("Treatment", secondary=user_treatments, back_populates="users")
    experiences = relationship("Experience", secondary=user_experiences, back_populates="users") 
