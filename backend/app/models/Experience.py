from sqlalchemy import Column, Enum, Integer, String
from sqlalchemy.orm import relationship

from .Base import Base


class Experience(Base):
    __tablename__ = "experiences"
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)  # 'PTSD', 'Relapse', etc.
    scope = Column(Enum("patient", "caregiver", "both", "none", name="scope"), nullable=False)

    # Back reference for many-to-many relationship
    users = relationship("UserData", secondary="user_experiences", back_populates="experiences")
