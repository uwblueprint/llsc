import uuid

from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .Base import Base


class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = Column(String(80), nullable=False)
    last_name = Column(String(80), nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    auth_id = Column(String, nullable=False)

    role = relationship("Role")
    form = relationship("Form", back_populates="User", uselist=False)
