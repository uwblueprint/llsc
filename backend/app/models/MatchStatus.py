from sqlalchemy import Column, Integer, String

from .Base import Base


class MatchStatus(Base):
    __tablename__ = "match_status"
    id = Column(Integer, primary_key=True)
    name = Column(String(80), nullable=False)
