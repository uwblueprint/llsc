import uuid
from datetime import datetime

from app.models import Form, FormSubmission, Role, User


def create_test_user(db, role_name="participant"):
    """Create a test user with the specified role"""
    # Create role if it doesn't exist
    role = db.query(Role).filter(Role.name == role_name).first()
    if not role:
        role = Role(name=role_name)
        db.add(role)
        db.flush()

    # Create user
    user = User(
        id=uuid.uuid4(),
        first_name="Test",
        last_name="User",
        email="test@example.com",
        role_id=role.id,
        auth_id="test-user-id",
        approved=True,
    )
    db.add(user)
    db.flush()
    return user


def create_test_form(db):
    """Create a test intake form"""
    form = Form(id=uuid.uuid4(), name="Test Intake Form", version=1, type="intake")
    db.add(form)
    db.flush()
    return form


def create_test_submission(db, user=None, form=None):
    """Create a test form submission"""
    if not user:
        user = create_test_user(db)
    if not form:
        form = create_test_form(db)

    submission = FormSubmission(
        id=uuid.uuid4(),
        form_id=form.id,
        user_id=user.id,
        submitted_at=datetime.utcnow(),
        answers={"test_field": "test value", "another_field": 123},
    )
    db.add(submission)
    db.flush()
    return submission
