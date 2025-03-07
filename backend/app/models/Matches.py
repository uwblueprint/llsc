from sqlalchemy import Column, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .Base import Base

class Matches(Base):
    __tablename__ = "matches"

    user1_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    user2_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=func.now())

    __table_args__ = (
        UniqueConstraint("user1_id", "user2_id", name="unique_match"),
    )

    user1 = relationship("User", foreign_keys=[user1_id], back_populates="matches_as_user1")
    user2 = relationship("User", foreign_keys=[user2_id], back_populates="matches_as_user2")


    # see if there is a validator header here
    def __init__(self, user1_id, user2_id):
        """Ensure user1_id is always the smaller UUID before inserting"""
        # THIS IS TO ENSURE THAT ONLY (user_id1, userid2) OR (userid2, userid1) IS INSERTED
        if user1_id > user2_id:
            user1_id, user2_id = user2_id, user1_id
        self.user1_id = user1_id
        self.user2_id = user2_id
