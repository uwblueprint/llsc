"""Seed qualities data."""

from sqlalchemy.orm import Session

from app.models.Quality import Quality


def seed_qualities(session: Session) -> None:
    """Seed the qualities table with matching qualities."""

    qualities_data = [
        {"slug": "same_age", "label": "the same age as"},
        {"slug": "same_gender_identity", "label": "the same gender identity as"},
        {"slug": "same_ethnic_or_cultural_group", "label": "the same ethnic or cultural group as"},
        {"slug": "same_marital_status", "label": "the same marital status as"},
        {"slug": "same_parental_status", "label": "the same parental status as"},
        {"slug": "same_diagnosis", "label": "the same diagnosis as"},
    ]

    for quality_data in qualities_data:
        # Check if quality already exists
        existing_quality = session.query(Quality).filter_by(slug=quality_data["slug"]).first()
        if not existing_quality:
            quality = Quality(**quality_data)
            session.add(quality)
            print(f"Added quality: {quality_data['slug']}")
        else:
            # Update label in case it changed
            existing_quality.label = quality_data["label"]
            print(f"Quality already exists (updated label): {quality_data['slug']}")

    session.commit()
