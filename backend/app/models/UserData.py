import uuid

from sqlalchemy import JSON, Column, Date, ForeignKey, Integer, String, Table, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .Base import Base

# Bridge tables for many-to-many relationships
user_treatments = Table(
    "user_treatments",
    Base.metadata,
    Column("user_data_id", UUID(as_uuid=True), ForeignKey("user_data.id")),
    Column("treatment_id", Integer, ForeignKey("treatments.id")),
)

user_experiences = Table(
    "user_experiences",
    Base.metadata,
    Column("user_data_id", UUID(as_uuid=True), ForeignKey("user_data.id")),
    Column("experience_id", Integer, ForeignKey("experiences.id")),
)

# Bridge tables for loved one many-to-many relationships
user_loved_one_treatments = Table(
    "user_loved_one_treatments",
    Base.metadata,
    Column("user_data_id", UUID(as_uuid=True), ForeignKey("user_data.id")),
    Column("treatment_id", Integer, ForeignKey("treatments.id")),
)

user_loved_one_experiences = Table(
    "user_loved_one_experiences",
    Base.metadata,
    Column("user_data_id", UUID(as_uuid=True), ForeignKey("user_data.id")),
    Column("experience_id", Integer, ForeignKey("experiences.id")),
)


class UserData(Base):
    __tablename__ = "user_data"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Personal Information
    first_name = Column(String(80), nullable=True)
    last_name = Column(String(80), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    email = Column(String(120), nullable=True)
    phone = Column(String(20), nullable=True)
    city = Column(String(100), nullable=True)
    province = Column(String(50), nullable=True)
    postal_code = Column(String(10), nullable=True)

    # Demographics
    gender_identity = Column(String(50), nullable=True)
    pronouns = Column(JSON, nullable=True)  # Array of strings
    ethnic_group = Column(JSON, nullable=True)  # Array of strings
    marital_status = Column(String(50), nullable=True)
    has_kids = Column(String(10), nullable=True)

    # Cancer Experience
    diagnosis = Column(String(100), nullable=True)
    date_of_diagnosis = Column(Date, nullable=True)

    # "Other" text fields for custom entries
    other_ethnic_group = Column(Text, nullable=True)
    gender_identity_custom = Column(Text, nullable=True)

    # Flow control fields
    has_blood_cancer = Column(String(10), nullable=True)
    caring_for_someone = Column(String(10), nullable=True)

    # Loved One Demographics
    loved_one_gender_identity = Column(String(50), nullable=True)
    loved_one_age = Column(String(10), nullable=True)

    # Loved One Cancer Experience
    loved_one_diagnosis = Column(String(100), nullable=True)
    loved_one_date_of_diagnosis = Column(Date, nullable=True)

    # Many-to-many relationships
    treatments = relationship("Treatment", secondary=user_treatments, back_populates="users")
    experiences = relationship("Experience", secondary=user_experiences, back_populates="users")

    # Loved one many-to-many relationships
    loved_one_treatments = relationship("Treatment", secondary=user_loved_one_treatments)
    loved_one_experiences = relationship("Experience", secondary=user_loved_one_experiences)
