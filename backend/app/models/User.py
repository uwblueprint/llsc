from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from .Base import Base

class User(Base):
    __tablename__ = "users"

    first_name = Column(String(80), nullable=False)
    last_name = Column(String(80), nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    auth_id = Column(String, nullable=False)

    role = relationship("Role")

    matches_as_user1 = relationship("Matches", foreign_keys="[Matches.user1_id]", back_populates="user1")
    matches_as_user2 = relationship("Matches", foreign_keys="[Matches.user2_id]", back_populates="user2")

    @property
    def all_matches(self):
        """Returns all matches where the user is user1 or user2"""
        return self.matches_as_user1 + self.matches_as_user2

