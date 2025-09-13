"""Seed roles data."""

from sqlalchemy.orm import Session

from app.models.Role import Role


def seed_roles(session: Session) -> None:
    """Seed the roles table with default roles."""
    
    roles_data = [
        {"id": 1, "name": "participant"},
        {"id": 2, "name": "volunteer"},
        {"id": 3, "name": "admin"},
    ]
    
    for role_data in roles_data:
        # Check if role already exists
        existing_role = session.query(Role).filter_by(id=role_data["id"]).first()
        if not existing_role:
            role = Role(**role_data)
            session.add(role)
            print(f"Added role: {role_data['name']}")
        else:
            print(f"Role already exists: {role_data['name']}")
    
    session.commit()