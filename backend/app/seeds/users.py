"""Seed users data for testing matching functionality."""

import uuid
from datetime import date

from sqlalchemy.orm import Session

from app.models.Experience import Experience
from app.models.Treatment import Treatment
from app.models.User import User
from app.models.UserData import UserData
from app.utilities.form_constants import ExperienceId, TreatmentId


def seed_users(session: Session) -> None:
    """Seed users (patients/volunteers) with their basic data."""

    # Sample users data
    users_data = [
        # Participants (patients/caregivers)
        {
            "role": "participant",
            "user_data": {
                "first_name": "Sarah",
                "last_name": "Johnson",
                "email": "sarah.johnson@example.com",
                "auth_id": "auth_sarah_001",
                "date_of_birth": date(1985, 3, 15),
                "phone": "555-0101",
                "city": "Toronto",
                "province": "Ontario",
                "postal_code": "M5V 3A8",
                "gender_identity": "Woman",
                "pronouns": ["she", "her"],
                "ethnic_group": ["White/Caucasian"],
                "marital_status": "Married",
                "has_kids": "Yes",
                "diagnosis": "Acute Lymphoblastic Leukemia",
                "date_of_diagnosis": date(2023, 8, 10),
                "has_blood_cancer": "Yes",
                "caring_for_someone": "No",
            },
            "treatments": [3, 6],  # Chemotherapy, Radiation
            "experiences": [1, 4, 5],  # Brain Fog, Feeling Overwhelmed, Fatigue
        },
        {
            "role": "participant",
            "user_data": {
                "first_name": "Michael",
                "last_name": "Chen",
                "email": "michael.chen@example.com",
                "auth_id": "auth_michael_002",
                "date_of_birth": date(1978, 11, 22),
                "phone": "555-0102",
                "city": "Vancouver",
                "province": "British Columbia",
                "postal_code": "V6B 1A1",
                "gender_identity": "Man",
                "pronouns": ["he", "him"],
                "ethnic_group": ["Asian"],
                "marital_status": "Single",
                "has_kids": "No",
                "diagnosis": "Chronic Lymphocytic Leukemia",
                "date_of_diagnosis": date(2024, 1, 5),
                "has_blood_cancer": "Yes",
                "caring_for_someone": "No",
            },
            "treatments": [2, 14],  # Watch and Wait, BTK Inhibitors
            "experiences": [11, 12],  # Anxiety/Depression, PTSD
        },
        {
            "role": "participant",
            "user_data": {
                "first_name": "Lisa",
                "last_name": "Rodriguez",
                "email": "lisa.rodriguez@example.com",
                "auth_id": "auth_lisa_003",
                "date_of_birth": date(1972, 7, 8),
                "phone": "555-0103",
                "city": "Montreal",
                "province": "Quebec",
                "postal_code": "H3A 0G4",
                "gender_identity": "Woman",
                "pronouns": ["she", "her"],
                "ethnic_group": ["Hispanic/Latino"],
                "marital_status": "Married",
                "has_kids": "Yes",
                "has_blood_cancer": "No",
                "caring_for_someone": "Yes",
                "loved_one_gender_identity": "Man",
                "loved_one_age": "55",
                "loved_one_diagnosis": "Multiple Myeloma",
                "loved_one_date_of_diagnosis": date(2023, 12, 15),
            },
            "treatments": [],  # Caregiver, no personal treatments
            "experiences": [
                ExperienceId.COMPASSION_FATIGUE,
                ExperienceId.FEELING_OVERWHELMED,
                ExperienceId.SPEAKING_TO_FAMILY,
            ],
        },
        # Volunteers
        {
            "role": "volunteer",
            "user_data": {
                "first_name": "David",
                "last_name": "Thompson",
                "email": "david.thompson@example.com",
                "auth_id": "auth_david_004",
                "date_of_birth": date(1980, 5, 12),
                "phone": "555-0201",
                "city": "Toronto",
                "province": "Ontario",
                "postal_code": "M4W 1A8",
                "gender_identity": "Man",
                "pronouns": ["he", "him"],
                "ethnic_group": ["White/Caucasian"],
                "marital_status": "Married",
                "has_kids": "Yes",
                "diagnosis": "Acute Lymphoblastic Leukemia",
                "date_of_diagnosis": date(2018, 4, 20),  # Survivor
                "has_blood_cancer": "Yes",
                "caring_for_someone": "No",
            },
            "treatments": [
                TreatmentId.CHEMOTHERAPY,
                TreatmentId.RADIATION,
                TreatmentId.AUTOLOGOUS_STEM_CELL_TRANSPLANT,
            ],
            "experiences": [
                ExperienceId.BRAIN_FOG,
                ExperienceId.FEELING_OVERWHELMED,
                ExperienceId.FATIGUE,
                ExperienceId.RETURNING_TO_WORK,
            ],
        },
        {
            "role": "volunteer",
            "user_data": {
                "first_name": "Jennifer",
                "last_name": "Kim",
                "email": "jennifer.kim@example.com",
                "auth_id": "auth_jennifer_005",
                "date_of_birth": date(1986, 9, 30),  # Similar age to Sarah (1985)
                "phone": "555-0202",
                "city": "Toronto",  # Same city as Sarah
                "province": "Ontario",  # Same province as Sarah
                "postal_code": "M5V 2H1",
                "gender_identity": "Woman",  # Same as Sarah
                "pronouns": ["she", "her"],
                "ethnic_group": ["Asian"],
                "marital_status": "Married",  # Same as Sarah
                "has_kids": "Yes",  # Same as Sarah
                "diagnosis": "Acute Lymphoblastic Leukemia",  # Same diagnosis as Sarah!
                "date_of_diagnosis": date(2020, 8, 15),  # Survivor
                "has_blood_cancer": "Yes",
                "caring_for_someone": "No",
            },
            "treatments": [3, 6],  # Chemotherapy, Radiation (matching Sarah's preferences)
            "experiences": [1, 4, 5],  # Brain Fog, Feeling Overwhelmed, Fatigue (same as Sarah!)
        },
        {
            "role": "volunteer",
            "user_data": {
                "first_name": "Robert",
                "last_name": "Williams",
                "email": "robert.williams@example.com",
                "auth_id": "auth_robert_006",
                "date_of_birth": date(1983, 12, 3),
                "phone": "555-0203",
                "city": "Ottawa",
                "province": "Ontario",
                "postal_code": "K1P 1J1",
                "gender_identity": "Man",
                "pronouns": ["he", "him"],
                "ethnic_group": ["Black/African"],
                "marital_status": "Single",
                "has_kids": "No",
                "diagnosis": "Hodgkin Lymphoma",
                "date_of_diagnosis": date(2020, 2, 14),
                "has_blood_cancer": "Yes",
                "caring_for_someone": "No",
            },
            "treatments": [3, 6],  # Chemotherapy, Radiation
            "experiences": [11, 12, 8],  # Anxiety/Depression, PTSD, Returning to work
        },
        # High-matching volunteers for Sarah Johnson
        {
            "role": "volunteer",
            "user_data": {
                "first_name": "Emily",
                "last_name": "Chen",
                "email": "emily.chen@example.com",
                "auth_id": "auth_emily_007",
                "date_of_birth": date(1984, 7, 22),  # Similar age to Sarah (1985)
                "phone": "555-0301",
                "city": "Toronto",  # Same city as Sarah
                "province": "Ontario",  # Same province as Sarah
                "postal_code": "M5V 3B2",
                "gender_identity": "Woman",  # Same as Sarah
                "pronouns": ["she", "her"],
                "ethnic_group": ["Asian"],
                "marital_status": "Married",  # Same as Sarah
                "has_kids": "Yes",  # Same as Sarah
                "diagnosis": "Acute Lymphoblastic Leukemia",  # Same diagnosis as Sarah!
                "date_of_diagnosis": date(2019, 5, 10),  # Survivor
                "has_blood_cancer": "Yes",
                "caring_for_someone": "No",
            },
            "treatments": [3, 6],  # Chemotherapy, Radiation (matching Sarah's preferences)
            "experiences": [1, 4, 5],  # Brain Fog, Feeling Overwhelmed, Fatigue (same as Sarah!)
        },
        {
            "role": "volunteer",
            "user_data": {
                "first_name": "Lisa",
                "last_name": "Rodriguez",
                "email": "lisa.rodriguez@example.com",
                "auth_id": "auth_lisa_008",
                "date_of_birth": date(1987, 2, 14),  # Similar age to Sarah
                "phone": "555-0302",
                "city": "Toronto",  # Same city as Sarah
                "province": "Ontario",  # Same province as Sarah
                "postal_code": "M4W 2K5",
                "gender_identity": "Woman",  # Same as Sarah
                "pronouns": ["she", "her"],
                "ethnic_group": ["Hispanic/Latino"],
                "marital_status": "Married",  # Same as Sarah
                "has_kids": "Yes",  # Same as Sarah
                "diagnosis": "Acute Lymphoblastic Leukemia",  # Same diagnosis as Sarah!
                "date_of_diagnosis": date(2021, 3, 18),  # Survivor
                "has_blood_cancer": "Yes",
                "caring_for_someone": "No",
            },
            "treatments": [3, 6],  # Chemotherapy, Radiation (matching Sarah's preferences)
            "experiences": [1, 4, 5, 11],  # Brain Fog, Feeling Overwhelmed, Fatigue, Anxiety/Depression
        },
        {
            "role": "volunteer",
            "user_data": {
                "first_name": "Amanda",
                "last_name": "Taylor",
                "email": "amanda.taylor@example.com",
                "auth_id": "auth_amanda_009",
                "date_of_birth": date(1983, 11, 8),  # Similar age to Sarah
                "phone": "555-0303",
                "city": "Mississauga",  # Close to Toronto
                "province": "Ontario",  # Same province as Sarah
                "postal_code": "L5B 3C1",
                "gender_identity": "Woman",  # Same as Sarah
                "pronouns": ["she", "her"],
                "ethnic_group": ["White/Caucasian"],
                "marital_status": "Married",  # Same as Sarah
                "has_kids": "Yes",  # Same as Sarah
                "diagnosis": "Acute Lymphoblastic Leukemia",  # Same diagnosis as Sarah!
                "date_of_diagnosis": date(2018, 9, 25),  # Survivor
                "has_blood_cancer": "Yes",
                "caring_for_someone": "No",
            },
            "treatments": [3, 6, 7],  # Chemotherapy, Radiation, Maintenance Chemo
            "experiences": [1, 4, 5],  # Brain Fog, Feeling Overwhelmed, Fatigue (same as Sarah!)
        },
        # Test Case 3: Participant who is a caregiver wanting caregiver volunteers
        {
            "role": "participant",
            "user_data": {
                "first_name": "Karen",
                "last_name": "Davis",
                "email": "karen.davis@example.com",
                "auth_id": "auth_karen_010",
                "date_of_birth": date(1978, 4, 12),
                "phone": "555-0401",
                "city": "Toronto",
                "province": "Ontario",
                "postal_code": "M6K 3M2",
                "gender_identity": "Woman",
                "pronouns": ["she", "her"],
                "ethnic_group": ["White/Caucasian"],
                "marital_status": "Married",
                "has_kids": "Yes",
                "has_blood_cancer": "No",  # Not a cancer patient herself
                "caring_for_someone": "Yes",  # Is a caregiver
                "loved_one_gender_identity": "Woman",
                "loved_one_age": "45",
                "loved_one_diagnosis": "Breast Cancer",
                "loved_one_date_of_diagnosis": date(2023, 2, 20),
            },
            "treatments": [],  # Caregiver, no personal treatments
            "experiences": [
                ExperienceId.COMPASSION_FATIGUE,
                ExperienceId.FEELING_OVERWHELMED,
                ExperienceId.ANXIETY_DEPRESSION,
            ],
        },
    ]

    created_users = []

    # Create users and their data
    for user_info in users_data:
        role_id = 1 if user_info["role"] == "participant" else 2

        # Check if user already exists
        existing_user = session.query(User).filter_by(email=user_info["user_data"]["email"]).first()
        if existing_user:
            print(f"User already exists: {user_info['user_data']['email']}")
            continue

        # Create user
        user = User(
            id=uuid.uuid4(),
            first_name=user_info["user_data"]["first_name"],
            last_name=user_info["user_data"]["last_name"],
            email=user_info["user_data"]["email"],
            role_id=role_id,
            auth_id=user_info["user_data"]["auth_id"],
            approved=True,
            active=True,
        )
        session.add(user)
        session.flush()  # Get user ID

        # Create user data
        user_data = UserData(
            user_id=user.id,
            **{
                k: v
                for k, v in user_info["user_data"].items()
                if k not in ["first_name", "last_name", "email", "auth_id"]
            },
        )
        session.add(user_data)

        # Add treatments if they exist
        if user_info["treatments"]:
            treatments = session.query(Treatment).filter(Treatment.id.in_(user_info["treatments"])).all()
            user_data.treatments = treatments

        # Add experiences if they exist
        if user_info["experiences"]:
            experiences = session.query(Experience).filter(Experience.id.in_(user_info["experiences"])).all()
            user_data.experiences = experiences

        created_users.append((user, user_info["role"]))
        print(f"Added {user_info['role']}: {user.first_name} {user.last_name}")

    session.commit()
