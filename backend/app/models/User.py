from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from .Base import Base


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)  # UUID
    first_name = Column(String(80), nullable=True)
    last_name = Column(String(80), nullable=True)
    email = Column(String(120), unique=True, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"))

    role = relationship("Role")
