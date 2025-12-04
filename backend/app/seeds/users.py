"""Seed users data for testing matching functionality."""

import uuid
from datetime import date, time

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models.AvailabilityTemplate import AvailabilityTemplate
from app.models.Experience import Experience
from app.models.FormSubmission import FormSubmission
from app.models.Match import Match
from app.models.RankingPreference import RankingPreference
from app.models.SuggestedTime import suggested_times
from app.models.Task import Task
from app.models.Treatment import Treatment
from app.models.User import FormStatus, Language, User
from app.models.UserData import UserData
from app.models.VolunteerData import VolunteerData
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
                "marital_status": "Married/Common Law",
                "has_kids": "Yes",
                "diagnosis": "Acute Lymphoblastic Leukemia",
                "date_of_diagnosis": date(2023, 8, 10),
                "has_blood_cancer": "yes",
                "caring_for_someone": "no",
            },
            "treatments": [3, 6],  # Chemotherapy, Radiation
            "experiences": [1, 3, 4],  # Brain Fog, Feeling Overwhelmed, Fatigue
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
                "has_blood_cancer": "yes",
                "caring_for_someone": "no",
            },
            "treatments": [2, 14],  # Watch and Wait, BTK Inhibitors
            "experiences": [10, 11],  # Anxiety/Depression, PTSD
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
                "marital_status": "Married/Common Law",
                "has_kids": "Yes",
                "has_blood_cancer": "no",
                "caring_for_someone": "yes",
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
            "loved_one_treatments": [3, 10],  # Chemotherapy, Autologous Stem Cell Transplant
            "loved_one_experiences": [3, 4, 10],  # Feeling Overwhelmed, Fatigue, Anxiety/Depression
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
                "marital_status": "Married/Common Law",
                "has_kids": "Yes",
                "diagnosis": "Acute Lymphoblastic Leukemia",
                "date_of_diagnosis": date(2018, 4, 20),  # Survivor
                "has_blood_cancer": "yes",
                "caring_for_someone": "no",
                "timezone": "EST",
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
            "volunteer_experience": "My journey with blood cancer started when I was about twelve years old and getting treatment for the first time was extremely stress-inducing. My journey with blood cancer started when I was about twelve years old and getting treatment for the first time was extremely stress-inducing.",
            "availability_templates": [
                {"day_of_week": 1, "start_time": time(14, 0), "end_time": time(16, 0)},  # Tuesday 2-4pm
                {"day_of_week": 3, "start_time": time(14, 0), "end_time": time(17, 0)},  # Thursday 2-5pm
                {"day_of_week": 4, "start_time": time(10, 0), "end_time": time(12, 0)},  # Friday 10am-12pm
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
                "marital_status": "Married/Common Law",  # Same as Sarah
                "has_kids": "Yes",  # Same as Sarah
                "diagnosis": "Acute Lymphoblastic Leukemia",  # Same diagnosis as Sarah!
                "date_of_diagnosis": date(2020, 8, 15),  # Survivor
                "has_blood_cancer": "yes",
                "caring_for_someone": "no",
                "timezone": "PST",
            },
            "treatments": [3, 6],  # Chemotherapy, Radiation (matching Sarah's preferences)
            "experiences": [1, 3, 4],  # Brain Fog, Feeling Overwhelmed, Fatigue (same as Sarah!)
            "volunteer_experience": "I was diagnosed with ALL at 34 and underwent intensive chemotherapy and radiation. The hardest part was balancing treatment with being a mother. I want to help others navigate this difficult journey and share what I learned.",
            "availability_templates": [
                {"day_of_week": 0, "start_time": time(16, 0), "end_time": time(18, 0)},  # Monday 4-6pm
                {"day_of_week": 2, "start_time": time(11, 0), "end_time": time(13, 0)},  # Wednesday 11am-1pm
                {"day_of_week": 4, "start_time": time(13, 0), "end_time": time(15, 0)},  # Friday 1-3pm
            ],
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
                "has_blood_cancer": "yes",
                "caring_for_someone": "no",
                "timezone": "EST",
            },
            "treatments": [3, 6],  # Chemotherapy, Radiation
            "experiences": [10, 11, 7],  # Anxiety/Depression, PTSD, Returning to work
            "volunteer_experience": "Fighting Hodgkin Lymphoma taught me resilience I never knew I had. The mental health challenges were just as tough as the physical ones. I'm here to listen and support anyone going through similar struggles.",
            "availability_templates": [
                {"day_of_week": 1, "start_time": time(9, 0), "end_time": time(11, 0)},  # Tuesday 9-11am
                {"day_of_week": 3, "start_time": time(14, 0), "end_time": time(16, 0)},  # Thursday 2-4pm
                {"day_of_week": 5, "start_time": time(10, 0), "end_time": time(12, 0)},  # Saturday 10am-12pm
            ],
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
                "marital_status": "Married/Common Law",  # Same as Sarah
                "has_kids": "Yes",  # Same as Sarah
                "diagnosis": "Acute Lymphoblastic Leukemia",  # Same diagnosis as Sarah!
                "date_of_diagnosis": date(2019, 5, 10),  # Survivor
                "has_blood_cancer": "yes",
                "caring_for_someone": "no",
                "timezone": "EST",
            },
            "treatments": [3, 6],  # Chemotherapy, Radiation (matching Sarah's preferences)
            "experiences": [1, 3, 4],  # Brain Fog, Feeling Overwhelmed, Fatigue (same as Sarah!)
            "volunteer_experience": "As a working mother of two, being diagnosed with leukemia turned my world upside down. Brain fog and fatigue made everyday tasks feel impossible. Now in remission, I'm passionate about helping others find their strength during treatment.",
            "availability_templates": [
                {"day_of_week": 2, "start_time": time(14, 0), "end_time": time(17, 0)},  # Wednesday 2-5pm
                {"day_of_week": 3, "start_time": time(16, 0), "end_time": time(18, 0)},  # Thursday 4-6pm
            ],
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
                "marital_status": "Married/Common Law",  # Same as Sarah
                "has_kids": "Yes",  # Same as Sarah
                "diagnosis": "Acute Lymphoblastic Leukemia",  # Same diagnosis as Sarah!
                "date_of_diagnosis": date(2021, 3, 18),  # Survivor
                "has_blood_cancer": "yes",
                "caring_for_someone": "no",
                "timezone": "MST",
            },
            "treatments": [3, 6],  # Chemotherapy, Radiation (matching Sarah's preferences)
            "experiences": [1, 3, 4, 10],  # Brain Fog, Feeling Overwhelmed, Fatigue, Anxiety/Depression
            "volunteer_experience": "My cancer journey came with intense anxiety and depression alongside the physical symptoms. Through therapy and support groups, I learned to cope with the overwhelming emotions. I want to be that supportive voice for others facing the same battles.",
            "availability_templates": [
                {"day_of_week": 0, "start_time": time(10, 0), "end_time": time(12, 0)},  # Monday 10am-12pm
                {"day_of_week": 4, "start_time": time(14, 30), "end_time": time(16, 30)},  # Friday 2:30-4:30pm
            ],
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
                "marital_status": "Married/Common Law",  # Same as Sarah
                "has_kids": "Yes",  # Same as Sarah
                "diagnosis": "Acute Lymphoblastic Leukemia",  # Same diagnosis as Sarah!
                "date_of_diagnosis": date(2018, 9, 25),  # Survivor
                "has_blood_cancer": "yes",
                "caring_for_someone": "no",
                "timezone": "CST",
            },
            "treatments": [3, 6, 7],  # Chemotherapy, Radiation, Maintenance Chemo
            "experiences": [1, 4, 5],  # Brain Fog, Feeling Overwhelmed, Fatigue (same as Sarah!)
            "volunteer_experience": "Seven years ago, ALL changed everything. The fatigue was relentless, and brain fog made me feel like a stranger in my own mind. But I made it through, and now I want to offer hope and practical advice to anyone starting this journey.",
            "availability_templates": [
                {"day_of_week": 1, "start_time": time(15, 0), "end_time": time(17, 0)},  # Tuesday 3-5pm
                {"day_of_week": 3, "start_time": time(10, 0), "end_time": time(12, 0)},  # Thursday 10am-12pm
                {"day_of_week": 5, "start_time": time(14, 0), "end_time": time(16, 0)},  # Saturday 2-4pm
            ],
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
                "marital_status": "Married/Common Law",
                "has_kids": "Yes",
                "has_blood_cancer": "no",  # Not a cancer patient herself
                "caring_for_someone": "yes",  # Is a caregiver
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
            "loved_one_treatments": [3, 6],  # Chemotherapy, Radiation
            "loved_one_experiences": [3, 4],  # Feeling Overwhelmed, Fatigue
        },
    ]

    created_users = []

    # Create users and their data
    for user_info in users_data:
        role_id = 1 if user_info["role"] == "participant" else 2

        # Check if user already exists
        existing_user = session.query(User).filter_by(email=user_info["user_data"]["email"]).first()
        if existing_user:
            print(f"User already exists, overwriting: {user_info['user_data']['email']}")
            user_id = existing_user.id

            # Manually delete all related data first (since cascade delete may not be configured)
            # Delete ranking preferences
            session.query(RankingPreference).filter(RankingPreference.user_id == user_id).delete()

            # Get matches that need to be deleted (to delete suggested_times first)
            matches_to_delete = (
                session.query(Match).filter((Match.participant_id == user_id) | (Match.volunteer_id == user_id)).all()
            )

            # Delete suggested_times for these matches first (must be done before deleting matches)
            # Use raw SQL to delete from suggested_times table to avoid relationship issues
            match_ids = [match.id for match in matches_to_delete]
            if match_ids:
                session.execute(delete(suggested_times).where(suggested_times.c.match_id.in_(match_ids)))
                session.flush()  # Ensure suggested_times deletions are processed

            # Now delete the matches (after suggested_times are cleared)
            for match in matches_to_delete:
                session.delete(match)

            # Delete form submissions
            session.query(FormSubmission).filter(FormSubmission.user_id == user_id).delete()

            # Delete tasks (as participant or assignee)
            session.query(Task).filter((Task.participant_id == user_id) | (Task.assignee_id == user_id)).delete()

            # Delete user_data and its relationships
            if existing_user.user_data:
                # Clear many-to-many relationships first
                existing_user.user_data.treatments.clear()
                existing_user.user_data.experiences.clear()
                existing_user.user_data.loved_one_treatments.clear()
                existing_user.user_data.loved_one_experiences.clear()
                session.delete(existing_user.user_data)

            # Delete volunteer_data
            if existing_user.volunteer_data:
                session.delete(existing_user.volunteer_data)

            # Clear availability templates
            session.query(AvailabilityTemplate).filter_by(user_id=existing_user.id).delete()

            # Now delete the user
            session.delete(existing_user)
            session.flush()  # Ensure deletion is processed before creating new user

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
            form_status=FormStatus.INTAKE_TODO,
            language=Language.ENGLISH,
        )
        session.add(user)
        session.flush()  # Get user ID

        # Create user data
        user_data = UserData(
            user_id=user.id,
            first_name=user_info["user_data"]["first_name"],
            last_name=user_info["user_data"]["last_name"],
            **{
                k: v
                for k, v in user_info["user_data"].items()
                if k not in ["first_name", "last_name", "email", "auth_id"]
            },
        )
        session.add(user_data)
        session.flush()  # Ensure user_data has an ID before assigning relationships

        # Add treatments if they exist
        if user_info.get("treatments"):
            treatments = session.query(Treatment).filter(Treatment.id.in_(user_info["treatments"])).all()
            user_data.treatments = treatments

        # Add experiences if they exist
        if user_info.get("experiences"):
            experiences = session.query(Experience).filter(Experience.id.in_(user_info["experiences"])).all()
            user_data.experiences = experiences

        # Add loved one treatments if they exist
        if user_info.get("loved_one_treatments"):
            loved_one_treatments = (
                session.query(Treatment).filter(Treatment.id.in_(user_info["loved_one_treatments"])).all()
            )
            user_data.loved_one_treatments = loved_one_treatments

        # Add loved one experiences if they exist
        if user_info.get("loved_one_experiences"):
            loved_one_experiences = (
                session.query(Experience).filter(Experience.id.in_(user_info["loved_one_experiences"])).all()
            )
            user_data.loved_one_experiences = loved_one_experiences

        # Create volunteer_data entry for volunteers with experience text
        if user_info["role"] == "volunteer":
            volunteer_experience_text = user_info.get(
                "volunteer_experience",
                "My journey with blood cancer started when I was about twelve years old and getting "
                "treatment for the first time was extremely stress-inducing. My journey with blood "
                "cancer started when I was about twelve years old and getting treatment for the first "
                "time was extremely stress-inducing.",
            )

            volunteer_data = VolunteerData(
                user_id=user.id,
                experience=volunteer_experience_text,
            )
            session.add(volunteer_data)

            # Add availability templates for volunteers (if specified)
            # Skip yashkothari@uwblueprint.org so they can set their own availability
            if (
                user_info.get("availability_templates")
                and user_info["user_data"]["email"] != "yashkothari@uwblueprint.org"
            ):
                for template_info in user_info["availability_templates"]:
                    availability_template = AvailabilityTemplate(
                        user_id=user.id,
                        day_of_week=template_info["day_of_week"],
                        start_time=template_info["start_time"],
                        end_time=template_info["end_time"],
                        is_active=True,
                    )
                    session.add(availability_template)

        created_users.append((user, user_info["role"]))
        print(f"Added {user_info['role']}: {user.first_name} {user.last_name}")

    session.commit()
