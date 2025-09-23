"""Seed experiences data."""

from sqlalchemy.orm import Session

from app.models.Experience import Experience


def seed_experiences(session: Session) -> None:
    """Seed the experiences table with cancer-related experiences."""

    experiences_data = [
        {"id": 1, "name": "Brain Fog", "scope": "both"},
        {"id": 2, "name": "Communication Challenges", "scope": "caregiver"},
        {"id": 3, "name": "Compassion Fatigue", "scope": "none"},
        {"id": 4, "name": "Feeling Overwhelmed", "scope": "both"},
        {"id": 5, "name": "Fatigue", "scope": "both"},
        {"id": 6, "name": "Fertility Issues", "scope": "patient"},
        {"id": 7, "name": "Graft vs Host", "scope": "patient"},
        {"id": 8, "name": "Returning to work or school after/during treatment", "scope": "patient"},
        {"id": 9, "name": "Speaking to your family or friends about the diagnosis", "scope": "both"},
        {"id": 10, "name": "Relapse", "scope": "patient"},
        {"id": 11, "name": "Anxiety / Depression", "scope": "both"},
        {"id": 12, "name": "PTSD", "scope": "both"},
    ]

    for experience_data in experiences_data:
        # Check if experience already exists
        existing_experience = session.query(Experience).filter_by(id=experience_data["id"]).first()
        if not existing_experience:
            experience = Experience(**experience_data)
            session.add(experience)
            print(f"Added experience: {experience_data['name']}")
        else:
            print(f"Experience already exists: {experience_data['name']}")

    session.commit()
