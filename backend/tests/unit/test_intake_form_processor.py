import uuid
from datetime import date

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.Experience import Experience
from app.models.Role import Role
from app.models.Treatment import Treatment
from app.models.User import FormStatus, User
from app.models.UserData import UserData
from app.schemas.user import UserRole
from app.services.implementations.intake_form_processor import IntakeFormProcessor

# Test DB Configuration - Use SQLite with UUID handling fixes
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_intake.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Provide a clean database session for each test"""
    # Create tables excluding FormSubmission to avoid JSONB issues
    tables_to_create = [
        Role.__table__,
        User.__table__,
        UserData.__table__,
        Treatment.__table__,
        Experience.__table__,
        # Bridge tables from UserData model
        UserData.__table__.metadata.tables.get("user_treatments"),
        UserData.__table__.metadata.tables.get("user_experiences"),
        UserData.__table__.metadata.tables.get("user_loved_one_treatments"),
        UserData.__table__.metadata.tables.get("user_loved_one_experiences"),
    ]

    for table in tables_to_create:
        if table is not None:
            table.create(bind=engine, checkfirst=True)

    session = TestingSessionLocal()

    try:
        # Clean up any existing data first
        session.query(UserData).delete()
        session.query(User).delete()
        session.query(Treatment).delete()
        session.query(Experience).delete()
        session.query(Role).delete()
        session.commit()

        # Create test roles
        roles = [
            Role(id=1, name=UserRole.PARTICIPANT),
            Role(id=2, name=UserRole.VOLUNTEER),
            Role(id=3, name=UserRole.ADMIN),
        ]
        for role in roles:
            session.add(role)

        # Create test treatments (predefined)
        treatments = [
            Treatment(id=1, name="Unknown"),
            Treatment(id=2, name="Watch and Wait / Active Surveillance"),
            Treatment(id=3, name="Chemotherapy"),
            Treatment(id=4, name="Immunotherapy"),
            Treatment(id=5, name="Oral Chemotherapy"),
            Treatment(id=6, name="Radiation"),
            Treatment(id=7, name="Maintenance Chemotherapy"),
            Treatment(id=8, name="Palliative Care"),
            Treatment(id=9, name="Transfusions"),
            Treatment(id=10, name="Autologous Stem Cell Transplant"),
            Treatment(id=11, name="Allogeneic Stem Cell Transplant"),
            Treatment(id=12, name="Haplo Stem Cell Transplant"),
            Treatment(id=13, name="CAR-T"),
            Treatment(id=14, name="BTK Inhibitors"),
        ]
        for treatment in treatments:
            session.add(treatment)

        # Create test experiences (predefined)
        experiences = [
            Experience(id=1, name="Brain Fog", scope="both"),
            Experience(id=2, name="Communication Challenges", scope="caregiver"),
            Experience(id=3, name="Feeling Overwhelmed", scope="both"),
            Experience(id=4, name="Fatigue", scope="both"),
            Experience(id=5, name="Fertility Issues", scope="patient"),
            Experience(id=6, name="Graft vs Host", scope="patient"),
            Experience(id=7, name="Returning to work or school after/during treatment", scope="patient"),
            Experience(id=8, name="Speaking to your family or friends about the diagnosis", scope="both"),
            Experience(id=9, name="Relapse", scope="patient"),
            Experience(id=10, name="Anxiety", scope="both"),
            Experience(id=11, name="PTSD", scope="both"),
            Experience(id=12, name="Caregiver Fatigue", scope="caregiver"),
            Experience(id=13, name="Managing practical challenges", scope="caregiver"),
            Experience(id=14, name="Depression", scope="both"),
        ]
        for experience in experiences:
            session.add(experience)

        session.commit()
        yield session

    finally:
        session.rollback()
        session.close()
        # Clean up - drop the tables we created
        tables_to_drop = [
            UserData.__table__.metadata.tables.get("user_loved_one_experiences"),
            UserData.__table__.metadata.tables.get("user_loved_one_treatments"),
            UserData.__table__.metadata.tables.get("user_experiences"),
            UserData.__table__.metadata.tables.get("user_treatments"),
            UserData.__table__,
            User.__table__,
            Treatment.__table__,
            Experience.__table__,
            Role.__table__,
        ]

        for table in tables_to_drop:
            if table is not None:
                table.drop(bind=engine, checkfirst=True)


@pytest.fixture
def test_user(db_session):
    """Create a test user for intake processing"""
    test_uuid = uuid.uuid4()
    user = User(
        id=test_uuid, first_name="Test", last_name="User", email="test@example.com", role_id=1, auth_id="test_auth_id"
    )
    db_session.add(user)
    db_session.commit()
    return user


def test_participant_with_cancer_only(db_session, test_user):
    """Test processing a complete participant intake form with cancer experience"""
    try:
        # Arrange
        processor = IntakeFormProcessor(db_session)
        form_data = {
            "form_type": "participant",
            "has_blood_cancer": "yes",
            "caring_for_someone": "no",
            "personal_info": {
                "first_name": "John",
                "last_name": "Doe",
                "date_of_birth": "15/03/1985",
                "phone_number": "555-123-4567",
                "city": "Toronto",
                "province": "Ontario",
                "postal_code": "M1A 1A1",
            },
            "demographics": {
                "gender_identity": "Male",
                "pronouns": ["he", "him"],
                "ethnic_group": ["White"],
                "marital_status": "Married",
                "has_kids": "yes",
            },
            "cancer_experience": {
                "diagnosis": "Leukemia",
                "date_of_diagnosis": "01/01/2023",
                "treatments": ["Chemotherapy", "Transfusions"],
                "experiences": ["Anxiety", "Fatigue"],
            },
        }

        # Act
        user_data = processor.process_form_submission(str(test_user.id), form_data)

        # Assert - Personal Info
        assert user_data.first_name == "John"
        assert user_data.last_name == "Doe"
        assert user_data.date_of_birth == date(1985, 3, 15)
        assert user_data.phone == "555-123-4567"
        assert user_data.city == "Toronto"
        assert user_data.province == "Ontario"
        assert user_data.postal_code == "M1A 1A1"

        # Assert - Demographics
        assert user_data.gender_identity == "Male"
        assert user_data.pronouns == ["he", "him"]
        assert user_data.ethnic_group == ["White"]
        assert user_data.marital_status == "Married"
        assert user_data.has_kids == "yes"

        # Assert - Cancer Experience
        assert user_data.diagnosis == "Leukemia"
        assert user_data.date_of_diagnosis == date(2023, 1, 1)

        # Assert - Flow Control
        assert user_data.has_blood_cancer == "yes"
        assert user_data.caring_for_someone == "no"

        # Assert - Treatments (many-to-many)
        treatment_names = [t.name for t in user_data.treatments]
        assert "Chemotherapy" in treatment_names
        assert "Transfusions" in treatment_names
        assert len(user_data.treatments) == 2

        # Assert - Experiences (many-to-many)
        experience_names = [e.name for e in user_data.experiences]
        assert "Anxiety" in experience_names
        assert "Fatigue" in experience_names
        assert len(user_data.experiences) == 2

        # Assert - No loved one data
        assert user_data.loved_one_gender_identity is None
        assert user_data.loved_one_diagnosis is None
        assert len(user_data.loved_one_treatments) == 0
        assert len(user_data.loved_one_experiences) == 0

        db_session.refresh(test_user)
        assert test_user.form_status == FormStatus.INTAKE_SUBMITTED

        db_session.commit()

    except Exception:
        db_session.rollback()
        raise


def test_volunteer_caregiver_experience_processing(db_session, test_user):
    """Test processing volunteer caregiver experience (separate from cancer experience)"""
    try:
        # Arrange
        processor = IntakeFormProcessor(db_session)
        form_data = {
            "form_type": "volunteer",
            "has_blood_cancer": "no",
            "caring_for_someone": "yes",
            "personal_info": {
                "first_name": "Alice",
                "last_name": "Volunteer",
                "date_of_birth": "25/08/1975",
                "phone_number": "555-111-2222",
                "city": "Calgary",
                "province": "Alberta",
                "postal_code": "T2A 1A1",
            },
            "demographics": {
                "gender_identity": "Female",
                "pronouns": ["she", "her"],
                "ethnic_group": ["Indigenous"],
                "marital_status": "Divorced",
                "has_kids": "yes",
            },
            "caregiver_experience": {
                "experiences": ["Anxiety", "Depression"],
            },
            "loved_one": {
                "demographics": {"gender_identity": "Male", "age": "45-54"},
                "cancer_experience": {
                    "diagnosis": "Brain Cancer",
                    "date_of_diagnosis": "10/05/2020",
                    "treatments": ["Transfusions", "Radiation"],
                    "experiences": ["Depression", "Fatigue"],
                },
            },
        }

        # Act
        user_data = processor.process_form_submission(str(test_user.id), form_data)

        # Assert - Flow Control
        assert user_data.has_blood_cancer == "no"
        assert user_data.caring_for_someone == "yes"

        # Assert - Personal Info
        assert user_data.first_name == "Alice"
        assert user_data.last_name == "Volunteer"
        assert user_data.city == "Calgary"

        # Assert - Demographics
        assert user_data.gender_identity == "Female"
        assert user_data.ethnic_group == ["Indigenous"]
        assert user_data.marital_status == "Divorced"

        # Assert - Caregiver Experience (mapped to user experiences)
        experience_names = [e.name for e in user_data.experiences]
        assert "Anxiety" in experience_names
        assert "Depression" in experience_names

        # Assert - No personal cancer experience
        assert user_data.diagnosis is None
        assert user_data.date_of_diagnosis is None
        assert len(user_data.treatments) == 0

        # Assert - Loved One Data
        assert user_data.loved_one_gender_identity == "Male"
        assert user_data.loved_one_age == "45-54"
        assert user_data.loved_one_diagnosis == "Brain Cancer"
        assert user_data.loved_one_date_of_diagnosis == date(2020, 5, 10)

        # Assert - Loved One Treatments and Experiences
        loved_one_treatment_names = [t.name for t in user_data.loved_one_treatments]
        loved_one_experience_names = [e.name for e in user_data.loved_one_experiences]

        assert "Transfusions" in loved_one_treatment_names
        assert "Radiation" in loved_one_treatment_names
        assert "Depression" in loved_one_experience_names
        assert "Fatigue" in loved_one_experience_names

        db_session.refresh(test_user)
        assert test_user.form_status == FormStatus.INTAKE_SUBMITTED

        db_session.commit()

    except Exception:
        db_session.rollback()
        raise


def test_form_submission_json_structure(db_session, test_user):
    """Test that the processor handles complex JSON form data correctly including nested structures"""
    try:
        # Arrange - Complex form data with nested structures
        processor = IntakeFormProcessor(db_session)
        complex_form_data = {
            "form_type": "participant",
            "has_blood_cancer": "yes",
            "caring_for_someone": "yes",
            "personal_info": {
                "first_name": "Maria",
                "last_name": "Complex",
                "date_of_birth": "12/11/1988",
                "phone_number": "555-999-8888",
                "city": "Edmonton",
                "province": "Alberta",
                "postal_code": "T5A 2B2",
            },
            "demographics": {
                "gender_identity": "Self-describe",
                "gender_identity_custom": "Non-binary",
                "pronouns": ["they", "them"],
                "ethnic_group": ["Other", "Asian"],
                "ethnic_group_custom": "Mixed heritage - Filipino and Indigenous",
                "marital_status": "Common-law",
                "has_kids": "yes",
            },
            "cancer_experience": {
                "diagnosis": "Ovarian Cancer",
                "date_of_diagnosis": "03/07/2022",
                "treatments": ["Chemotherapy", "CAR-T"],
                "experiences": ["Anxiety", "Fertility Issues"],
            },
            "loved_one": {
                "demographics": {"gender_identity": "Female", "age": "65+"},
                "cancer_experience": {
                    "diagnosis": "Lung Cancer",
                    "date_of_diagnosis": "15/01/2021",
                    "treatments": ["Radiation", "Palliative Care"],
                    "experiences": ["Brain Fog", "Feeling Overwhelmed"],
                },
            },
        }

        # Act
        user_data = processor.process_form_submission(str(test_user.id), complex_form_data)

        # Assert - Complex Demographics Processing
        assert user_data.gender_identity == "Self-describe"
        assert user_data.gender_identity_custom == "Non-binary"
        assert user_data.pronouns == ["they", "them"]
        assert "Other" in user_data.ethnic_group and "Asian" in user_data.ethnic_group
        assert user_data.other_ethnic_group == "Mixed heritage - Filipino and Indigenous"

        # Assert - Loved One Complex Data
        assert user_data.loved_one_gender_identity == "Female"
        assert user_data.loved_one_age == "65+"
        assert user_data.loved_one_diagnosis == "Lung Cancer"

        # Assert - Both User and Loved One Have Relationships
        assert len(user_data.treatments) >= 2  # Chemo + CAR-T
        assert len(user_data.experiences) >= 2  # Anxiety + Fertility
        assert len(user_data.loved_one_treatments) >= 2  # Radiation + Palliative
        assert len(user_data.loved_one_experiences) >= 2  # Brain Fog + Feeling Overwhelmed

        db_session.refresh(test_user)
        assert test_user.form_status == FormStatus.INTAKE_SUBMITTED

        db_session.commit()

    except Exception:
        db_session.rollback()
        raise


def test_empty_and_minimal_data_handling(db_session, test_user):
    """Test processor handles minimal/empty data gracefully"""
    try:
        # Arrange - Minimal form data
        processor = IntakeFormProcessor(db_session)
        minimal_form_data = {
            "form_type": "volunteer",
            "has_blood_cancer": "no",
            "caring_for_someone": "no",
            "personal_info": {
                "first_name": "Min",
                "last_name": "Imal",
                "date_of_birth": "01/01/2000",
                "phone_number": "",  # Empty string
                "city": "Toronto",
                "province": "Ontario",
                "postal_code": "M1A 1A1",
            },
            "demographics": {
                "gender_identity": "Prefer not to say",
                "pronouns": [],  # Empty array
                "ethnic_group": [],  # Empty array
                "marital_status": "",  # Empty string
                "has_kids": "",
            },
            # No cancer_experience, caregiver_experience, or loved_one sections
        }

        # Act
        user_data = processor.process_form_submission(str(test_user.id), minimal_form_data)

        # Assert - Required fields populated
        assert user_data.first_name == "Min"
        assert user_data.last_name == "Imal"
        assert user_data.date_of_birth == date(2000, 1, 1)
        assert user_data.city == "Toronto"

        # Assert - Empty fields handled gracefully
        assert user_data.phone == ""
        assert user_data.pronouns == []
        assert user_data.ethnic_group == []
        assert user_data.marital_status == ""

        # Assert - Optional sections remain None/empty
        assert user_data.diagnosis is None
        assert len(user_data.treatments) == 0
        assert len(user_data.experiences) == 0
        assert user_data.loved_one_gender_identity is None

        db_session.refresh(test_user)
        assert test_user.form_status == FormStatus.INTAKE_SUBMITTED

        db_session.commit()

    except Exception:
        db_session.rollback()
        raise


def test_participant_caregiver_without_cancer(db_session, test_user):
    """Test Flow 2: Participant caregiver without cancer (basic demographics + loved one data)"""
    try:
        # Arrange
        processor = IntakeFormProcessor(db_session)
        form_data = {
            "form_type": "participant",
            "has_blood_cancer": "no",
            "caring_for_someone": "yes",
            "personal_info": {
                "first_name": "Sarah",
                "last_name": "Caregiver",
                "date_of_birth": "10/09/1975",
                "phone_number": "555-222-3333",
                "city": "Ottawa",
                "province": "Ontario",
                "postal_code": "K1A 0A6",
            },
            "demographics": {
                "gender_identity": "Female",
                "pronouns": ["she", "her"],
                "ethnic_group": ["Black"],
                "marital_status": "Married",
                "has_kids": "yes",
            },
            "loved_one": {
                "demographics": {"gender_identity": "Male", "age": "55-64"},
                "cancer_experience": {
                    "diagnosis": "Prostate Cancer",
                    "date_of_diagnosis": "20/03/2021",
                    "treatments": ["Transfusions", "Immunotherapy"],
                    "experiences": ["Anxiety", "Communication Challenges"],
                },
            },
        }

        # Act
        user_data = processor.process_form_submission(str(test_user.id), form_data)

        # Assert - Flow Control
        assert user_data.has_blood_cancer == "no"
        assert user_data.caring_for_someone == "yes"

        # Assert - Personal Info
        assert user_data.first_name == "Sarah"
        assert user_data.last_name == "Caregiver"

        # Assert - Demographics
        assert user_data.gender_identity == "Female"
        assert user_data.ethnic_group == ["Black"]

        # Assert - No personal cancer experience
        assert user_data.diagnosis is None
        assert user_data.date_of_diagnosis is None
        assert len(user_data.treatments) == 0
        assert len(user_data.experiences) == 0

        # Assert - Loved One Data
        assert user_data.loved_one_gender_identity == "Male"
        assert user_data.loved_one_age == "55-64"
        assert user_data.loved_one_diagnosis == "Prostate Cancer"
        assert user_data.loved_one_date_of_diagnosis == date(2021, 3, 20)

        # Assert - Loved One Relationships
        loved_one_treatment_names = [t.name for t in user_data.loved_one_treatments]
        loved_one_experience_names = [e.name for e in user_data.loved_one_experiences]
        assert "Transfusions" in loved_one_treatment_names
        assert "Immunotherapy" in loved_one_treatment_names
        assert "Anxiety" in loved_one_experience_names
        assert "Communication Challenges" in loved_one_experience_names

        db_session.commit()

    except Exception:
        db_session.rollback()
        raise


def test_participant_cancer_patient_and_caregiver(db_session, test_user):
    """Test Flow 5: Participant with cancer AND caregiver (own cancer + loved one data)"""
    try:
        # Arrange
        processor = IntakeFormProcessor(db_session)
        form_data = {
            "form_type": "participant",
            "has_blood_cancer": "yes",
            "caring_for_someone": "yes",
            "personal_info": {
                "first_name": "David",
                "last_name": "BothRoles",
                "date_of_birth": "05/11/1980",
                "phone_number": "555-444-5555",
                "city": "Halifax",
                "province": "Nova Scotia",
                "postal_code": "B3H 3C3",
            },
            "demographics": {
                "gender_identity": "Male",
                "pronouns": ["he", "him"],
                "ethnic_group": ["White", "Other"],
                "ethnic_group_custom": "Mixed European heritage",
                "marital_status": "Married",
                "has_kids": "yes",
            },
            "cancer_experience": {
                "diagnosis": "Lymphoma",
                "date_of_diagnosis": "15/08/2022",
                "treatments": ["Chemotherapy", "Radiation"],
                "experiences": ["Fatigue", "Depression"],
            },
            "loved_one": {
                "demographics": {"gender_identity": "Female", "age": "35-44"},
                "cancer_experience": {
                    "diagnosis": "Breast Cancer",
                    "date_of_diagnosis": "10/01/2023",
                    "treatments": ["Transfusions", "Chemotherapy"],
                    "experiences": ["Graft vs Host", "Feeling Overwhelmed"],
                },
            },
        }

        # Act
        user_data = processor.process_form_submission(str(test_user.id), form_data)

        # Assert - Flow Control
        assert user_data.has_blood_cancer == "yes"
        assert user_data.caring_for_someone == "yes"

        # Assert - Own Cancer Experience
        assert user_data.diagnosis == "Lymphoma"
        assert user_data.date_of_diagnosis == date(2022, 8, 15)

        # Assert - Own Treatments/Experiences
        treatment_names = [t.name for t in user_data.treatments]
        experience_names = [e.name for e in user_data.experiences]
        assert "Chemotherapy" in treatment_names
        assert "Radiation" in treatment_names
        assert "Fatigue" in experience_names
        assert "Depression" in experience_names

        # Assert - Loved One Data
        assert user_data.loved_one_diagnosis == "Breast Cancer"
        assert user_data.loved_one_date_of_diagnosis == date(2023, 1, 10)

        # Assert - Loved One Relationships
        loved_one_treatment_names = [t.name for t in user_data.loved_one_treatments]
        loved_one_experience_names = [e.name for e in user_data.loved_one_experiences]
        assert "Transfusions" in loved_one_treatment_names
        assert "Chemotherapy" in loved_one_treatment_names
        assert "Graft vs Host" in loved_one_experience_names
        assert "Feeling Overwhelmed" in loved_one_experience_names

        # Assert - Custom demographics
        assert "Other" in user_data.ethnic_group
        assert user_data.other_ethnic_group == "Mixed European heritage"

        db_session.commit()

    except Exception:
        db_session.rollback()
        raise


def test_participant_no_cancer_experience(db_session, test_user):
    """Test Flow 7: Participant with no cancer experience (basic demographics only)"""
    try:
        # Arrange
        processor = IntakeFormProcessor(db_session)
        form_data = {
            "form_type": "participant",
            "has_blood_cancer": "no",
            "caring_for_someone": "no",
            "personal_info": {
                "first_name": "Emma",
                "last_name": "NoCancer",
                "date_of_birth": "22/04/1995",
                "phone_number": "555-777-8888",
                "city": "Winnipeg",
                "province": "Manitoba",
                "postal_code": "R3C 3P4",
            },
            "demographics": {
                "gender_identity": "Female",
                "pronouns": ["she", "her"],
                "ethnic_group": ["Asian", "Indigenous"],
                "marital_status": "Single",
                "has_kids": "no",
            },
            # No cancer_experience, caregiver_experience, or loved_one sections
        }

        # Act
        user_data = processor.process_form_submission(str(test_user.id), form_data)

        # Assert - Flow Control
        assert user_data.has_blood_cancer == "no"
        assert user_data.caring_for_someone == "no"

        # Assert - Personal Info
        assert user_data.first_name == "Emma"
        assert user_data.last_name == "NoCancer"
        assert user_data.date_of_birth == date(1995, 4, 22)

        # Assert - Demographics
        assert user_data.gender_identity == "Female"
        assert user_data.pronouns == ["she", "her"]
        assert "Asian" in user_data.ethnic_group
        assert "Indigenous" in user_data.ethnic_group
        assert user_data.marital_status == "Single"
        assert user_data.has_kids == "no"

        # Assert - No cancer-related data
        assert user_data.diagnosis is None
        assert user_data.date_of_diagnosis is None
        assert len(user_data.treatments) == 0
        assert len(user_data.experiences) == 0

        # Assert - No loved one data
        assert user_data.loved_one_gender_identity is None
        assert user_data.loved_one_diagnosis is None
        assert len(user_data.loved_one_treatments) == 0
        assert len(user_data.loved_one_experiences) == 0

        db_session.commit()

    except Exception:
        db_session.rollback()
        raise


def test_volunteer_cancer_patient_only(db_session, test_user):
    """Test Flow 6: Volunteer with cancer only (cancer experience, no caregiving)"""
    try:
        # Arrange
        processor = IntakeFormProcessor(db_session)
        form_data = {
            "form_type": "volunteer",
            "has_blood_cancer": "yes",
            "caring_for_someone": "no",
            "personal_info": {
                "first_name": "Michael",
                "last_name": "VolunteerSurvivor",
                "date_of_birth": "18/07/1970",
                "phone_number": "555-101-2020",
                "city": "Regina",
                "province": "Saskatchewan",
                "postal_code": "S4P 3Y2",
            },
            "demographics": {
                "gender_identity": "Male",
                "pronouns": ["he", "him"],
                "ethnic_group": ["Indigenous"],
                "marital_status": "Widowed",
                "has_kids": "yes",
            },
            "cancer_experience": {
                "diagnosis": "Myeloma",
                "date_of_diagnosis": "12/05/2019",
                "treatments": ["Chemotherapy", "Autologous Stem Cell Transplant"],
                "experiences": ["Depression", "Anxiety"],
            },
        }

        # Act
        user_data = processor.process_form_submission(str(test_user.id), form_data)

        # Assert - Flow Control
        assert user_data.has_blood_cancer == "yes"
        assert user_data.caring_for_someone == "no"

        # Assert - Personal Info
        assert user_data.first_name == "Michael"
        assert user_data.last_name == "VolunteerSurvivor"

        # Assert - Cancer Experience
        assert user_data.diagnosis == "Myeloma"
        assert user_data.date_of_diagnosis == date(2019, 5, 12)

        # Assert - Treatments/Experiences
        treatment_names = [t.name for t in user_data.treatments]
        experience_names = [e.name for e in user_data.experiences]
        assert "Chemotherapy" in treatment_names
        assert "Autologous Stem Cell Transplant" in treatment_names
        assert "Depression" in experience_names
        assert "Anxiety" in experience_names

        # Assert - No loved one data (not a caregiver)
        assert user_data.loved_one_gender_identity is None
        assert user_data.loved_one_diagnosis is None
        assert len(user_data.loved_one_treatments) == 0
        assert len(user_data.loved_one_experiences) == 0

        db_session.commit()

    except Exception:
        db_session.rollback()
        raise


def test_volunteer_cancer_patient_and_caregiver(db_session, test_user):
    """Test Flow 3: Volunteer with cancer AND caregiver (own cancer + loved one data)"""
    try:
        # Arrange
        processor = IntakeFormProcessor(db_session)
        form_data = {
            "form_type": "volunteer",
            "has_blood_cancer": "yes",
            "caring_for_someone": "yes",
            "personal_info": {
                "first_name": "Lisa",
                "last_name": "VolunteerBoth",
                "date_of_birth": "03/12/1965",
                "phone_number": "555-303-4040",
                "city": "Victoria",
                "province": "British Columbia",
                "postal_code": "V8W 1P6",
            },
            "demographics": {
                "gender_identity": "Female",
                "pronouns": ["she", "her"],
                "ethnic_group": ["White"],
                "marital_status": "Married",
                "has_kids": "yes",
            },
            "cancer_experience": {
                "diagnosis": "Breast Cancer",
                "date_of_diagnosis": "08/11/2015",
                "treatments": ["Transfusions", "Chemotherapy", "Radiation"],
                "experiences": ["Graft vs Host", "Anxiety"],
            },
            "loved_one": {
                "demographics": {"gender_identity": "Male", "age": "65+"},
                "cancer_experience": {
                    "diagnosis": "Pancreatic Cancer",
                    "date_of_diagnosis": "25/09/2023",
                    "treatments": ["Transfusions", "Palliative Care"],
                    "experiences": ["Brain Fog", "Fatigue"],
                },
            },
        }

        # Act
        user_data = processor.process_form_submission(str(test_user.id), form_data)

        # Assert - Flow Control
        assert user_data.has_blood_cancer == "yes"
        assert user_data.caring_for_someone == "yes"

        # Assert - Own Cancer Experience (10-year survivor)
        assert user_data.diagnosis == "Breast Cancer"
        assert user_data.date_of_diagnosis == date(2015, 11, 8)

        # Assert - Own Treatments (comprehensive)
        treatment_names = [t.name for t in user_data.treatments]
        assert "Transfusions" in treatment_names
        assert "Chemotherapy" in treatment_names
        assert "Radiation" in treatment_names
        assert len(user_data.treatments) == 3

        # Assert - Loved One Data (current patient)
        assert user_data.loved_one_diagnosis == "Pancreatic Cancer"
        assert user_data.loved_one_date_of_diagnosis == date(2023, 9, 25)

        # Assert - Both user and loved one have data
        assert len(user_data.treatments) >= 3
        assert len(user_data.experiences) >= 2
        assert len(user_data.loved_one_treatments) >= 2
        assert len(user_data.loved_one_experiences) >= 2

        db_session.commit()

    except Exception:
        db_session.rollback()
        raise


def test_volunteer_no_cancer_experience(db_session, test_user):
    """Test Flow 8: Volunteer with no cancer experience (basic demographics only)"""
    try:
        # Arrange
        processor = IntakeFormProcessor(db_session)
        form_data = {
            "form_type": "volunteer",
            "has_blood_cancer": "no",
            "caring_for_someone": "no",
            "personal_info": {
                "first_name": "Robert",
                "last_name": "VolunteerHelper",
                "date_of_birth": "14/06/1985",
                "phone_number": "555-505-6060",
                "city": "Fredericton",
                "province": "New Brunswick",
                "postal_code": "E3B 5A3",
            },
            "demographics": {
                "gender_identity": "Male",
                "pronouns": ["he", "him"],
                "ethnic_group": ["White"],
                "marital_status": "Single",
                "has_kids": "no",
            },
            # No cancer_experience, caregiver_experience, or loved_one sections
        }

        # Act
        user_data = processor.process_form_submission(str(test_user.id), form_data)

        # Assert - Flow Control
        assert user_data.has_blood_cancer == "no"
        assert user_data.caring_for_someone == "no"

        # Assert - Personal Info
        assert user_data.first_name == "Robert"
        assert user_data.last_name == "VolunteerHelper"
        assert user_data.date_of_birth == date(1985, 6, 14)

        # Assert - Demographics
        assert user_data.gender_identity == "Male"
        assert user_data.pronouns == ["he", "him"]
        assert user_data.ethnic_group == ["White"]
        assert user_data.marital_status == "Single"
        assert user_data.has_kids == "no"

        # Assert - No cancer-related data
        assert user_data.diagnosis is None
        assert user_data.date_of_diagnosis is None
        assert len(user_data.treatments) == 0
        assert len(user_data.experiences) == 0

        # Assert - No loved one data
        assert user_data.loved_one_gender_identity is None
        assert user_data.loved_one_diagnosis is None
        assert len(user_data.loved_one_treatments) == 0
        assert len(user_data.loved_one_experiences) == 0

        db_session.commit()

    except Exception:
        db_session.rollback()
        raise


# Error Handling Tests
def test_invalid_user_id_format(db_session):
    """Test error handling with invalid UUID format"""
    processor = IntakeFormProcessor(db_session)
    form_data = {
        "form_type": "participant",
        "has_blood_cancer": "yes",
        "caring_for_someone": "no",
        "personal_info": {
            "first_name": "Test",
            "last_name": "User",
            "date_of_birth": "01/01/1990",
            "phone_number": "555-1234",
            "city": "Test City",
            "province": "Test Province",
            "postal_code": "T1T 1T1",
        },
    }

    with pytest.raises(ValueError, match="Invalid UUID format"):
        processor.process_form_submission("invalid-uuid-format", form_data)


def test_missing_personal_info_section(db_session, test_user):
    """Test error handling with missing personalInfo section"""
    processor = IntakeFormProcessor(db_session)

    # Missing personal_info entirely should raise KeyError
    with pytest.raises(KeyError, match="personal_info section is required"):
        processor.process_form_submission(
            str(test_user.id),
            {
                "form_type": "participant",
                "has_blood_cancer": "yes",
                # No personal_info section
            },
        )


def test_missing_required_personal_info_fields(db_session, test_user):
    """Test error handling with missing required personalInfo fields"""
    processor = IntakeFormProcessor(db_session)

    # Missing required personal_info fields
    with pytest.raises(KeyError, match="Required field missing: personal_info.last_name"):
        processor.process_form_submission(
            str(test_user.id),
            {
                "form_type": "participant",
                "has_blood_cancer": "yes",
                "personal_info": {
                    "first_name": "Test"
                    # Missing other required fields
                },
            },
        )


def test_malformed_date_formats(db_session, test_user):
    """Test error handling with various malformed date formats"""
    processor = IntakeFormProcessor(db_session)

    # Invalid date format
    form_data = {
        "form_type": "participant",
        "has_blood_cancer": "yes",
        "caring_for_someone": "no",
        "personal_info": {
            "first_name": "Test",
            "last_name": "User",
            "date_of_birth": "invalid-date",
            "phone_number": "555-1234",
            "city": "Test City",
            "province": "Test Province",
            "postal_code": "T1T 1T1",
        },
    }

    with pytest.raises(ValueError, match="Invalid date format for dateOfBirth"):
        processor.process_form_submission(str(test_user.id), form_data)


def test_database_rollback_on_error(db_session, test_user):
    """Test that database transaction rolls back properly on errors"""
    processor = IntakeFormProcessor(db_session)

    # Count initial UserData records
    initial_count = db_session.query(UserData).count()

    # Attempt to process invalid data that should trigger rollback
    try:
        processor.process_form_submission(
            str(test_user.id),
            {
                "form_type": "participant",
                "has_blood_cancer": "yes",
                "personal_info": {
                    "first_name": "Test",
                    "last_name": "User",
                    "date_of_birth": "invalid-date",  # This will cause an error
                    "phone_number": "555-1234",
                    "city": "Test City",
                    "province": "Test Province",
                    "postal_code": "T1T 1T1",
                },
            },
        )
    except ValueError:
        pass  # Expected error

    # Verify no new records were created (rollback worked)
    final_count = db_session.query(UserData).count()
    assert final_count == initial_count


# Data Integrity Tests
def test_duplicate_form_submission_handling(db_session, test_user):
    """Test handling of duplicate form submissions for the same user"""
    try:
        processor = IntakeFormProcessor(db_session)
        form_data = {
            "form_type": "participant",
            "has_blood_cancer": "yes",
            "caring_for_someone": "no",
            "personal_info": {
                "first_name": "Original",
                "last_name": "User",
                "date_of_birth": "01/01/1990",
                "phone_number": "555-1111",
                "city": "Original City",
                "province": "Original Province",
                "postal_code": "O1O 1O1",
            },
            "cancer_experience": {
                "diagnosis": "Original Cancer",
                "date_of_diagnosis": "01/01/2020",
                "treatments": ["Surgery"],
                "experiences": ["Fatigue"],
            },
        }

        # First submission
        processor.process_form_submission(str(test_user.id), form_data)
        db_session.commit()

        # Second submission with different data (should update existing record)
        form_data["personal_info"]["first_name"] = "Updated"
        form_data["personal_info"]["city"] = "Updated City"
        form_data["cancer_experience"]["diagnosis"] = "Updated Cancer"

        processor.process_form_submission(str(test_user.id), form_data)
        db_session.commit()

        # Verify only one UserData record exists for this user (using correct field name)
        user_data_count = db_session.query(UserData).filter(UserData.user_id == test_user.id).count()
        assert user_data_count == 1

        # Verify data was updated, not duplicated
        final_user_data = db_session.query(UserData).filter(UserData.user_id == test_user.id).first()
        assert final_user_data.first_name == "Updated"
        assert final_user_data.city == "Updated City"
        assert final_user_data.diagnosis == "Updated Cancer"

    except Exception:
        db_session.rollback()
        raise


def test_text_trimming_and_normalization(db_session, test_user):
    """Test that text fields are properly trimmed and normalized"""
    try:
        processor = IntakeFormProcessor(db_session)
        form_data = {
            "form_type": "participant",
            "has_blood_cancer": "yes",
            "caring_for_someone": "no",
            "personal_info": {
                "first_name": "  John  ",  # Extra spaces
                "last_name": "\tDoe\n",  # Tabs and newlines
                "date_of_birth": "01/01/1990",
                "phone_number": "  555-1234  ",
                "city": "  Toronto  ",
                "province": "  Ontario  ",
                "postal_code": "  M5V 3A1  ",
            },
            "demographics": {"gender_identity": "  Male  ", "marital_status": "  Single  "},
            "cancer_experience": {
                "diagnosis": "  Leukemia  ",
                "date_of_diagnosis": "01/01/2020",
                "treatments": ["  Surgery  ", "  Chemotherapy  "],
                "experiences": ["  Fatigue  "],
            },
        }

        user_data = processor.process_form_submission(str(test_user.id), form_data)

        # Verify text fields are trimmed
        assert user_data.first_name == "John"
        assert user_data.last_name == "Doe"
        assert user_data.phone == "555-1234"
        assert user_data.city == "Toronto"
        assert user_data.province == "Ontario"
        assert user_data.postal_code == "M5V 3A1"
        assert user_data.gender_identity == "Male"
        assert user_data.marital_status == "Single"
        assert user_data.diagnosis == "Leukemia"

        db_session.commit()

    except Exception:
        db_session.rollback()
        raise


def test_sql_injection_prevention(db_session, test_user):
    """Test that the system prevents SQL injection attempts"""
    try:
        processor = IntakeFormProcessor(db_session)

        # Attempt SQL injection in various fields
        malicious_data = {
            "form_type": "participant",
            "has_blood_cancer": "yes",
            "caring_for_someone": "no",
            "personal_info": {
                "first_name": "'; DROP TABLE users; --",
                "last_name": "Robert'; DELETE FROM user_data; --",
                "date_of_birth": "01/01/1990",
                "phone_number": "555-1234",
                "city": "Toronto'; SELECT * FROM users; --",
                "province": "Ontario",
                "postal_code": "M5V 3A1",
            },
            "cancer_experience": {
                "diagnosis": "'; UNION SELECT password FROM users; --",
                "date_of_diagnosis": "01/01/2020",
                "treatments": ["Surgery"],
                "experiences": ["Fatigue"],
            },
        }

        # This should process safely without executing malicious SQL
        user_data = processor.process_form_submission(str(test_user.id), malicious_data)

        # Verify the malicious strings are stored as literal text, not executed
        assert user_data.first_name == "'; DROP TABLE users; --"
        assert "DELETE FROM user_data" in user_data.last_name

        # Verify no actual SQL injection occurred by checking database integrity
        user_count = db_session.query(User).count()
        assert user_count > 0  # Users table still exists and has data

        db_session.commit()

    except Exception:
        db_session.rollback()
        raise


def test_unicode_and_special_characters(db_session, test_user):
    """Test handling of Unicode characters and special symbols"""
    try:
        processor = IntakeFormProcessor(db_session)
        form_data = {
            "form_type": "participant",
            "has_blood_cancer": "yes",
            "caring_for_someone": "no",
            "personal_info": {
                "first_name": "José",  # Accented characters
                "last_name": "François-Müller",  # Multiple special chars
                "date_of_birth": "01/01/1990",
                "phone_number": "555-1234",
                "city": "Montréal",  # French accent
                "province": "Québec",  # French accent
                "postal_code": "H3A 1A1",
            },
            "demographics": {
                "gender_identity": "Non-binary",
                "pronouns": ["they", "them"],
                "ethnic_group": ["Other"],
                "ethnic_group_custom": "中国人 (Chinese) & हिन्दी (Hindi) 🌍",  # Unicode mix
            },
            "cancer_experience": {
                "diagnosis": "Leucémie (Leukemia)",
                "date_of_diagnosis": "01/01/2020",
                "treatments": ["Chimiothérapie"],
                "experiences": ["Fatigue"],
            },
        }

        user_data = processor.process_form_submission(str(test_user.id), form_data)

        # Verify Unicode characters are preserved
        assert user_data.first_name == "José"
        assert user_data.last_name == "François-Müller"
        assert user_data.city == "Montréal"
        assert user_data.province == "Québec"
        assert "中国人" in user_data.other_ethnic_group
        assert "हिन्दी" in user_data.other_ethnic_group
        assert "🌍" in user_data.other_ethnic_group

        db_session.commit()

    except Exception:
        db_session.rollback()
        raise


def test_boundary_date_values(db_session, test_user):
    """Test handling of boundary date values"""
    try:
        processor = IntakeFormProcessor(db_session)

        # Test with very old and very recent dates
        form_data = {
            "form_type": "participant",
            "has_blood_cancer": "yes",
            "caring_for_someone": "no",
            "personal_info": {
                "first_name": "Old",
                "last_name": "Person",
                "date_of_birth": "01/01/1920",  # Very old date
                "phone_number": "555-1234",
                "city": "Toronto",
                "province": "Ontario",
                "postal_code": "M5V 3A1",
            },
            "cancer_experience": {
                "diagnosis": "Leukemia",
                "date_of_diagnosis": "31/12/2023",  # Very recent date
                "treatments": ["Surgery"],
                "experiences": ["Fatigue"],
            },
        }

        user_data = processor.process_form_submission(str(test_user.id), form_data)

        # Verify boundary dates are handled correctly
        assert user_data.date_of_birth == date(1920, 1, 1)
        assert user_data.date_of_diagnosis == date(2023, 12, 31)

        db_session.commit()

    except Exception:
        db_session.rollback()
        raise
