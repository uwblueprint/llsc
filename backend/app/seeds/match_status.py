"""Seed match status data."""

from sqlalchemy.orm import Session

from app.models.MatchStatus import MatchStatus


def seed_match_status(session: Session) -> None:
    """Seed the match_status table with default statuses."""

    match_status_data = [
        {"id": 1, "name": "pending"},
        {"id": 2, "name": "confirmed"},
        {"id": 3, "name": "cancelled_by_participant"},
        {"id": 4, "name": "completed"},
        {"id": 5, "name": "no_show"},
        {"id": 6, "name": "rescheduled"},
        {"id": 7, "name": "cancelled_by_volunteer"},
        {"id": 8, "name": "requesting_new_times"},
        {"id": 9, "name": "requesting_new_volunteers"},
    ]

    for status_data in match_status_data:
        # Check if status already exists
        existing_status = session.query(MatchStatus).filter_by(id=status_data["id"]).first()
        if not existing_status:
            status = MatchStatus(**status_data)
            session.add(status)
            print(f"Added match status: {status_data['name']}")
        else:
            if existing_status.name != status_data["name"]:
                existing_status.name = status_data["name"]
                print(
                    "Updated match status id {status_id} name to {name}".format(
                        status_id=status_data["id"], name=status_data["name"]
                    )
                )
            else:
                print(f"Match status already exists: {status_data['name']}")

    session.commit()
