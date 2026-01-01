import uuid
from enum import Enum as PyEnum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from .Base import Base


class FormSubmissionStatus(str, PyEnum):
    """Status of a form submission in the approval workflow."""

    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"


class FormSubmission(Base):
    __tablename__ = "form_submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    form_id = Column(UUID(as_uuid=True), ForeignKey("forms.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    submitted_at = Column(DateTime(timezone=True), default=func.now())
    answers = Column(JSONB, nullable=False)  # raw payload
    status = Column(
        Enum(
            "pending_approval",
            "approved",
            "rejected",
            name="form_submission_status",
            create_type=False,  # Type already exists from migration
        ),
        nullable=False,
        default="pending_approval",
    )

    # Relationships
    form = relationship("Form")
    user = relationship("User")
