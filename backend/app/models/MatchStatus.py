from sqlalchemy import Column, Integer, Text

from .Base import Base


class MatchStatus(Base):
    __tablename__ = "match_status"
    id = Column(Integer, primary_key=True)
    name = Column(Text, nullable=False)
