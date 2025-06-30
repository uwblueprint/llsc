import uuid
from sqlalchemy import Column, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from .Base import Base


class FormSubmission(Base):
    __tablename__ = "form_submissions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    form_id = Column(UUID(as_uuid=True), ForeignKey("forms.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    submitted_at = Column(DateTime(timezone=True), default=func.now())
    answers = Column(JSONB, nullable=False)  # raw payload
    
    # Relationships
    form = relationship("Form")
    user = relationship("User") 
