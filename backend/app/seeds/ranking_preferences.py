"""Seed ranking preferences data."""

from sqlalchemy.orm import Session

from app.models.RankingPreference import RankingPreference
from app.models.User import User
from app.utilities.form_constants import QualityId, TreatmentId


def seed_ranking_preferences(session: Session) -> None:
    """Seed the ranking_preferences table with sample ranking data for testing all matching cases."""

    # Find users by email instead of hardcoding UUIDs

    # Test Case 1: Patient wants cancer patient volunteer
    sarah_user = session.query(User).filter_by(email="sarah.johnson@example.com").first()
    sarah_id = sarah_user.id if sarah_user else None

    # Test Case 2: Caregiver wants ONLY cancer patient volunteers
    lisa_user = session.query(User).filter_by(email="lisa.rodriguez@example.com").first()
    lisa_id = lisa_user.id if lisa_user else None

    # Test Case 3: Caregiver wants ONLY caregiver volunteers
    karen_user = session.query(User).filter_by(email="karen.davis@example.com").first()
    karen_id = karen_user.id if karen_user else None

    ranking_data = [
        # CASE 1: Sarah (patient) wants patient volunteers - 5 preferences
        {
            "user_id": sarah_id,
            "target_role": "patient",
            "kind": "quality",
            "quality_id": QualityId.SAME_DIAGNOSIS,
            "scope": "self",
            "rank": 1,
        },
        {
            "user_id": sarah_id,
            "target_role": "patient",
            "kind": "quality",
            "quality_id": QualityId.SAME_GENDER_IDENTITY,
            "scope": "self",
            "rank": 2,
        },
        {
            "user_id": sarah_id,
            "target_role": "patient",
            "kind": "quality",
            "quality_id": QualityId.SAME_AGE,
            "scope": "self",
            "rank": 3,
        },
        {
            "user_id": sarah_id,
            "target_role": "patient",
            "kind": "treatment",
            "treatment_id": TreatmentId.CHEMOTHERAPY,
            "scope": "self",
            "rank": 4,
        },
        {
            "user_id": sarah_id,
            "target_role": "patient",
            "kind": "treatment",
            "treatment_id": TreatmentId.RADIATION,
            "scope": "self",
            "rank": 5,
        },
        # CASE 2: Lisa (caregiver) wants ONLY patient volunteers - 5 preferences
        {
            "user_id": lisa_id,
            "target_role": "patient",
            "kind": "quality",
            "quality_id": QualityId.SAME_DIAGNOSIS,
            "scope": "loved_one",
            "rank": 1,
        },
        {
            "user_id": lisa_id,
            "target_role": "patient",
            "kind": "quality",
            "quality_id": QualityId.SAME_GENDER_IDENTITY,
            "scope": "loved_one",
            "rank": 2,
        },
        {
            "user_id": lisa_id,
            "target_role": "patient",
            "kind": "quality",
            "quality_id": QualityId.SAME_AGE,
            "scope": "loved_one",
            "rank": 3,
        },
        {
            "user_id": lisa_id,
            "target_role": "patient",
            "kind": "treatment",
            "treatment_id": TreatmentId.CHEMOTHERAPY,
            "scope": "loved_one",
            "rank": 4,
        },
        {
            "user_id": lisa_id,
            "target_role": "patient",
            "kind": "treatment",
            "treatment_id": TreatmentId.RADIATION,
            "scope": "loved_one",
            "rank": 5,
        },
        # CASE 3: Karen (caregiver) wants ONLY caregiver volunteers - 5 preferences
        {
            "user_id": karen_id,
            "target_role": "caregiver",
            "kind": "quality",
            "quality_id": QualityId.SAME_MARITAL_STATUS,
            "scope": "self",
            "rank": 1,
        },
        {
            "user_id": karen_id,
            "target_role": "caregiver",
            "kind": "quality",
            "quality_id": QualityId.SAME_PARENTAL_STATUS,
            "scope": "self",
            "rank": 2,
        },
        {
            "user_id": karen_id,
            "target_role": "caregiver",
            "kind": "quality",
            "quality_id": QualityId.SAME_GENDER_IDENTITY,
            "scope": "self",
            "rank": 3,
        },
        {
            "user_id": karen_id,
            "target_role": "caregiver",
            "kind": "quality",
            "quality_id": QualityId.SAME_AGE,
            "scope": "self",
            "rank": 4,
        },
        {
            "user_id": karen_id,
            "target_role": "caregiver",
            "kind": "quality",
            "quality_id": QualityId.SAME_DIAGNOSIS,
            "scope": "loved_one",  # Match caregiver's loved one diagnosis with volunteer's loved one
            "rank": 5,
        },
    ]

    for pref_data in ranking_data:
        # Skip Karen's preferences if she doesn't exist yet
        if pref_data["user_id"] is None:
            continue

        # Check if preference already exists
        existing_pref = (
            session.query(RankingPreference)
            .filter_by(
                user_id=pref_data["user_id"],
                target_role=pref_data["target_role"],
                kind=pref_data["kind"],
                rank=pref_data["rank"],
            )
            .first()
        )

        if not existing_pref:
            preference = RankingPreference(**pref_data)
            session.add(preference)
            print(
                f"Added ranking preference: {pref_data['kind']} rank {pref_data['rank']} for user {pref_data['user_id']}"
            )
        else:
            print(
                f"Ranking preference already exists: {pref_data['kind']} rank {pref_data['rank']} for user {pref_data['user_id']}"
            )

    session.commit()
