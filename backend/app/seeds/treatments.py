"""Seed treatments data."""

from sqlalchemy.orm import Session

from app.models.Treatment import Treatment


def seed_treatments(session: Session) -> None:
    """Seed the treatments table with cancer treatments."""
    
    treatments_data = [
        {"id": 1, "name": "Unknown"},
        {"id": 2, "name": "Watch and Wait / Active Surveillance"},
        {"id": 3, "name": "Chemotherapy"},
        {"id": 4, "name": "Immunotherapy"},
        {"id": 5, "name": "Oral Chemotherapy"},
        {"id": 6, "name": "Radiation"},
        {"id": 7, "name": "Maintenance Chemotherapy"},
        {"id": 8, "name": "Palliative Care"},
        {"id": 9, "name": "Transfusions"},
        {"id": 10, "name": "Autologous Stem Cell Transplant"},
        {"id": 11, "name": "Allogeneic Stem Cell Transplant"},
        {"id": 12, "name": "Haplo Stem Cell Transplant"},
        {"id": 13, "name": "CAR-T"},
        {"id": 14, "name": "BTK Inhibitors"},
    ]
    
    for treatment_data in treatments_data:
        # Check if treatment already exists
        existing_treatment = session.query(Treatment).filter_by(id=treatment_data["id"]).first()
        if not existing_treatment:
            treatment = Treatment(**treatment_data)
            session.add(treatment)
            print(f"Added treatment: {treatment_data['name']}")
        else:
            print(f"Treatment already exists: {treatment_data['name']}")
    
    session.commit()