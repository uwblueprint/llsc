import uuid

from sqlalchemy import Column, ForeignKey, Integer, String, Date, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .Base import Base

# Confirm the types later
class Form(Base):
    __tablename__ = "user_data"  
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    date_of_birth = Column(Date, nullable=True)
    email = Column(String(120), nullable=True)
    phone = Column(String(20), nullable=True)
    postal_code = Column(String(10), nullable=True)
    province = Column(String(50), nullable=True)
    city = Column(String(100), nullable=True)
    language = Column(String(50), nullable=True)
    criminal_record_status = Column(Boolean, nullable=True)
    blood_cancer_status = Column(Boolean, nullable=True)
    caregiver_status = Column(Boolean, nullable=True)
    caregiver_type = Column(String(100), nullable=True)
    diagnostic = Column(String(200), nullable=True)
    date_of_diagnosis = Column(Date, nullable=True)
    gender_identity = Column(String(50), nullable=True)
    pronouns = Column(String(50), nullable=True)
    ethnicity = Column(String(100), nullable=True)
    marital_status = Column(String(50), nullable=True)
    children_status = Column(Boolean, nullable=True)
    treatment = Column(Text, nullable=True)
    experience = Column(Text, nullable=True)
    preferences = Column(Text, nullable=True)

    # Relationship to User table
    user = relationship("User", back_populates="form")