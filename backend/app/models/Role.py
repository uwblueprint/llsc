from sqlalchemy import Column, Integer, Text

from .Base import Base


class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True)
    name = Column(Text, nullable=False)
