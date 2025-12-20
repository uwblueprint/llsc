"""
Utility functions for task creation.
"""

from sqlalchemy.orm import Session

from app.models import Task, TaskType, User


def create_volunteer_app_review_task(db: Session, user_id: str, form_type: str) -> None:
    """
    Create a VOLUNTEER_APP_REVIEW task for ranking or secondary application forms.

    Args:
        db: Database session
        user_id: UUID string of the user who submitted the form
        form_type: Either "ranking" or "secondary"
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return

        user_name = f"{user.first_name} {user.last_name}".strip() or user.email
        form_type_label = {
            "ranking": "ranking form",
            "secondary": "secondary application form",
        }.get(form_type, "form")

        review_task = Task(
            participant_id=user.id,
            type=TaskType.VOLUNTEER_APP_REVIEW,
            description=f"{user_name} submitted {form_type_label} for review",
        )
        db.add(review_task)
        db.commit()
    except Exception as e:
        # Log error but don't fail the request
        print(f"Failed to create VOLUNTEER_APP_REVIEW task: {str(e)}")
        db.rollback()
