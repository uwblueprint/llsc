"""Seed forms data."""

import uuid

from sqlalchemy.orm import Session

from app.models.Form import Form


def seed_forms(session: Session) -> None:
    """Seed the forms table with default form configurations."""

    forms_data = [
        {
            "id": "12345678-1234-1234-1234-123456789012",
            "name": "First Connection Participant Form",
            "version": 1,
            "type": "intake",
        },
        {
            "id": "12345678-1234-1234-1234-123456789013",
            "name": "First Connection Volunteer Form",
            "version": 1,
            "type": "intake",
        },
        {
            "id": "12345678-1234-1234-1234-123456789014",
            "name": "Ranking Form",
            "version": 1,
            "type": "ranking",
        },
        {
            "id": "12345678-1234-1234-1234-123456789015",
            "name": "Secondary Application Form",
            "version": 1,
            "type": "secondary",
        },
        {
            "id": "12345678-1234-1234-1234-123456789016",
            "name": "Become a Participant Form",
            "version": 1,
            "type": "become_participant",
        },
        {
            "id": "12345678-1234-1234-1234-123456789017",
            "name": "Become a Volunteer Form",
            "version": 1,
            "type": "become_volunteer",
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
            # Update existing form to match new name
            if existing_form.name != form_data["name"]:
                existing_form.name = form_data["name"]
                print(f"Updated form name: {form_data['name']}")
            else:
                print(f"Form already exists: {form_data['name']}")

    session.commit()
