from sqlalchemy import Column, Integer, String

from .Base import Base


class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True)
    name = Column(String(80), nullable=False)
