"""Seed forms data."""

import uuid
from sqlalchemy.orm import Session

from app.models.Form import Form


def seed_forms(session: Session) -> None:
    """Seed the forms table with default form configurations."""
    
    forms_data = [
        {
            "id": "12345678-1234-1234-1234-123456789012",
            "name": "Participant Intake Form",
            "version": 1,
            "type": "intake",
        },
        {
            "id": "12345678-1234-1234-1234-123456789013", 
            "name": "Volunteer Intake Form",
            "version": 1,
            "type": "intake",
        },
    ]
    
    for form_data in forms_data:
        # Check if form already exists
        form_id = uuid.UUID(form_data["id"])
        existing_form = session.query(Form).filter_by(id=form_id).first()
        if not existing_form:
            # Convert string UUID to UUID object
            form_data_copy = form_data.copy()
            form_data_copy["id"] = form_id
            form = Form(**form_data_copy)
            session.add(form)
            print(f"Added form: {form_data['name']}")
        else:
            print(f"Form already exists: {form_data['name']}")
    
    session.commit()