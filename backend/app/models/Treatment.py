from sqlalchemy import Column, Integer, Text
from sqlalchemy.orm import relationship

from .Base import Base


class Treatment(Base):
    __tablename__ = "treatments"
    id = Column(Integer, primary_key=True)
    name = Column(Text, unique=True, nullable=False)  # 'Chemotherapy', 'Immunotherapy', etc.

    # Back reference for many-to-many relationship
    users = relationship("UserData", secondary="user_treatments", back_populates="treatments")
