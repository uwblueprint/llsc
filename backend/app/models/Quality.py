from sqlalchemy import Column, Integer, String

from .Base import Base


class Quality(Base):
    __tablename__ = "qualities"
    id = Column(Integer, primary_key=True)
    slug = Column(String, unique=True, nullable=False)  # 'same_age', 'same_diagnosis', etc.
    label = Column(String, nullable=False)  # human-readable description
