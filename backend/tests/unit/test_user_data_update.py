import os
import pytest
from datetime import date, datetime, timedelta, time as dt_time, timezone
from uuid import uuid4
from sqlalchemy import create_engine, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from app.models import AvailabilityTemplate, Role, User, UserData, Treatment, Experience, TimeBlock
from app.schemas.user import UserRole
from app.schemas.user_data import UserDataUpdateRequest
from app.schemas.availability import (
    AvailabilityTemplateSlot,
    CreateAvailabilityRequest,
    DeleteAvailabilityRequest,
)
from app.services.implementations.user_service import UserService
from app.services.implementations.availability_service import AvailabilityService

# Test DB Configuration - Always require Postgres for full parity
POSTGRES_DATABASE_URL = os.getenv("POSTGRES_TEST_DATABASE_URL")
if not POSTGRES_DATABASE_URL:
    raise RuntimeError(
        "POSTGRES_TEST_DATABASE_URL is not set. Please export a Postgres URL, e.g. "
        "postgresql+psycopg2://postgres:postgres@db:5432/llsc_test"
    )
engine = create_engine(POSTGRES_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Provide a clean database session for each test"""
    from sqlalchemy import text
    from sqlalchemy.exc import IntegrityError

    session = TestingSessionLocal()

    try:
        # Clean up any existing data first
        session.execute(
            text(
                "TRUNCATE TABLE user_loved_one_experiences, user_loved_one_treatments, "
                "user_experiences, user_treatments, availability_templates, time_blocks, "
                "user_data, users RESTART IDENTITY CASCADE"
            )
        )
        session.commit()

        # Ensure roles exist
        existing = {r.id for r in session.query(Role).all()}
        seed_roles = [
            Role(id=1, name=UserRole.PARTICIPANT),
            Role(id=2, name=UserRole.VOLUNTEER),
            Role(id=3, name=UserRole.ADMIN),
        ]
        for role in seed_roles:
            if role.id not in existing:
                try:
                    session.add(role)
                    session.commit()
                except IntegrityError:
                    session.rollback()

        # Create test treatments (using IDs that don't conflict with seeded data)
        treatments = [
            Treatment(id=100, name="Chemotherapy"),
            Treatment(id=101, name="Radiation"),
            Treatment(id=102, name="Immunotherapy"),
            Treatment(id=103, name="Oral Chemotherapy"),
        ]
        for treatment in treatments:
            try:
                session.add(treatment)
                session.commit()
            except IntegrityError:
                session.rollback()

        # Create test experiences (using IDs that don't conflict with seeded data)
        experiences = [
            Experience(id=100, name="Fatigue", scope="both"),
            Experience(id=101, name="Anxiety / Depression", scope="both"),  # Match seeded data
            Experience(id=102, name="Brain Fog", scope="both"),
            Experience(id=103, name="Depression", scope="both"),
        ]
        for experience in experiences:
            try:
                session.add(experience)
                session.commit()
            except IntegrityError:
                session.rollback()

        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture
def test_user_with_data(db_session):
    """Create a test user with existing user_data"""
    user = User(
        id=uuid4(),
        auth_id="test-auth-id",
        email="test@example.com",
        role_id=1,  # PARTICIPANT
        first_name="John",
        last_name="Doe",
    )
    db_session.add(user)
    db_session.flush()

    user_data = UserData(
        user_id=user.id,
        first_name="John",
        last_name="Doe",
        date_of_birth=date(1990, 1, 1),
        phone="123-456-7890",
        gender_identity="Male",
        pronouns=["he/him"],
        ethnic_group=["White"],
        marital_status="Single",
        has_kids="No",
        diagnosis="Acute Myeloid Leukemia",
        date_of_diagnosis=date(2020, 1, 1),
        additional_info="Some additional info",
    )
    db_session.add(user_data)
    db_session.flush()

    # Add existing treatments and experiences
    treatment1 = db_session.query(Treatment).filter(Treatment.name == "Chemotherapy").first()
    treatment2 = db_session.query(Treatment).filter(Treatment.name == "Radiation").first()
    if treatment1:
        user_data.treatments.append(treatment1)
    if treatment2:
        user_data.treatments.append(treatment2)

    experience1 = db_session.query(Experience).filter(Experience.name == "Fatigue").first()
    # Note: The seeded experience is "Anxiety / Depression" not just "Anxiety"
    experience2 = db_session.query(Experience).filter(Experience.name == "Anxiety / Depression").first()
    if experience1:
        user_data.experiences.append(experience1)
    if experience2:
        user_data.experiences.append(experience2)

    db_session.commit()
    db_session.refresh(user)
    db_session.refresh(user_data)
    return user, user_data


@pytest.mark.asyncio
async def test_update_simple_fields(db_session, test_user_with_data):
    """Test updating simple fields like first_name, phone, etc."""
    user, user_data = test_user_with_data
    user_service = UserService(db_session)

    update_request = UserDataUpdateRequest(
        first_name="Jane",
        phone="987-654-3210",
        city="Toronto",
        province="ON",
        postal_code="M5H 2N2",
    )

    result = await user_service.update_user_data_by_id(str(user.id), update_request)

    assert result.user_data is not None
    assert result.user_data.first_name == "Jane"
    assert result.user_data.phone == "987-654-3210"
    assert result.user_data.city == "Toronto"
    assert result.user_data.province == "ON"
    assert result.user_data.postal_code == "M5H 2N2"
    # Verify other fields unchanged
    assert result.user_data.last_name == "Doe"
    assert result.user_data.date_of_birth == date(1990, 1, 1)


@pytest.mark.asyncio
async def test_update_array_fields(db_session, test_user_with_data):
    """Test updating array fields like pronouns and ethnic_group"""
    user, user_data = test_user_with_data
    user_service = UserService(db_session)

    update_request = UserDataUpdateRequest(
        pronouns=["she/her", "they/them"],
        ethnic_group=["Asian", "Pacific Islander"],
    )

    result = await user_service.update_user_data_by_id(str(user.id), update_request)

    assert result.user_data is not None
    assert result.user_data.pronouns == ["she/her", "they/them"]
    assert result.user_data.ethnic_group == ["Asian", "Pacific Islander"]
    # Verify old values are replaced
    assert "he/him" not in result.user_data.pronouns
    assert "White" not in result.user_data.ethnic_group


@pytest.mark.asyncio
async def test_update_treatments_clears_old_and_adds_new(db_session, test_user_with_data):
    """Test that updating treatments clears old ones and adds new ones"""
    user, user_data = test_user_with_data
    user_service = UserService(db_session)

    # Verify initial state
    initial_treatment_names = {t.name for t in user_data.treatments}
    assert "Chemotherapy" in initial_treatment_names
    assert "Radiation" in initial_treatment_names
    assert len(initial_treatment_names) == 2

    # Update with new treatments (using names that exist in seeded data)
    update_request = UserDataUpdateRequest(
        treatments=["Immunotherapy", "Oral Chemotherapy"],
    )

    result = await user_service.update_user_data_by_id(str(user.id), update_request)

    assert result.user_data is not None
    result_treatment_names = {t.name for t in result.user_data.treatments}
    
    # Verify old treatments are removed
    assert "Chemotherapy" not in result_treatment_names
    assert "Radiation" not in result_treatment_names
    
    # Verify new treatments are added
    assert "Immunotherapy" in result_treatment_names
    assert "Oral Chemotherapy" in result_treatment_names
    assert len(result_treatment_names) == 2


@pytest.mark.asyncio
async def test_update_experiences_clears_old_and_adds_new(db_session, test_user_with_data):
    """Test that updating experiences clears old ones and adds new ones"""
    user, user_data = test_user_with_data
    user_service = UserService(db_session)

    # Verify initial state
    initial_experience_names = {e.name for e in user_data.experiences}
    assert "Fatigue" in initial_experience_names
    assert "Anxiety / Depression" in initial_experience_names
    assert len(initial_experience_names) == 2

    # Update with new experiences (using names that exist in seeded data)
    update_request = UserDataUpdateRequest(
        experiences=["Brain Fog", "Feeling Overwhelmed"],
    )

    result = await user_service.update_user_data_by_id(str(user.id), update_request)

    assert result.user_data is not None
    result_experience_names = {e.name for e in result.user_data.experiences}
    
    # Verify old experiences are removed
    assert "Fatigue" not in result_experience_names
    assert "Anxiety / Depression" not in result_experience_names
    
    # Verify new experiences are added
    assert "Brain Fog" in result_experience_names
    assert "Feeling Overwhelmed" in result_experience_names
    assert len(result_experience_names) == 2


@pytest.mark.asyncio
async def test_update_treatments_with_empty_list_clears_all(db_session, test_user_with_data):
    """Test that passing empty list clears all treatments"""
    user, user_data = test_user_with_data
    user_service = UserService(db_session)

    # Verify initial state has treatments
    assert len(user_data.treatments) == 2

    # Update with empty list
    update_request = UserDataUpdateRequest(treatments=[])

    result = await user_service.update_user_data_by_id(str(user.id), update_request)

    assert result.user_data is not None
    assert len(result.user_data.treatments) == 0


@pytest.mark.asyncio
async def test_update_loved_one_treatments(db_session, test_user_with_data):
    """Test updating loved one treatments"""
    user, user_data = test_user_with_data
    
    # Add initial loved one treatments
    treatment1 = db_session.query(Treatment).filter(Treatment.name == "Chemotherapy").first()
    user_data.loved_one_treatments.append(treatment1)
    db_session.commit()
    
    user_service = UserService(db_session)

    # Update with new loved one treatments
    update_request = UserDataUpdateRequest(
        loved_one_treatments=["Radiation", "Immunotherapy"],
    )

    result = await user_service.update_user_data_by_id(str(user.id), update_request)

    assert result.user_data is not None
    result_treatment_names = {t.name for t in result.user_data.loved_one_treatments}
    
    # Verify old treatment is removed
    assert "Chemotherapy" not in result_treatment_names
    
    # Verify new treatments are added
    assert "Radiation" in result_treatment_names
    assert "Immunotherapy" in result_treatment_names
    assert len(result_treatment_names) == 2


@pytest.mark.asyncio
async def test_update_loved_one_experiences(db_session, test_user_with_data):
    """Test updating loved one experiences"""
    user, user_data = test_user_with_data
    
    # Add initial loved one experiences
    experience1 = db_session.query(Experience).filter(Experience.name == "Fatigue").first()
    user_data.loved_one_experiences.append(experience1)
    db_session.commit()
    
    user_service = UserService(db_session)

    # Update with new loved one experiences
    update_request = UserDataUpdateRequest(
        loved_one_experiences=["Anxiety / Depression", "Brain Fog"],
    )

    result = await user_service.update_user_data_by_id(str(user.id), update_request)

    assert result.user_data is not None
    result_experience_names = {e.name for e in result.user_data.loved_one_experiences}
    
    # Verify old experience is removed
    assert "Fatigue" not in result_experience_names
    
    # Verify new experiences are added
    assert "Anxiety / Depression" in result_experience_names
    assert "Brain Fog" in result_experience_names
    assert len(result_experience_names) == 2


@pytest.mark.asyncio
async def test_update_partial_fields_preserves_others(db_session, test_user_with_data):
    """Test that partial updates don't affect other fields"""
    user, user_data = test_user_with_data
    user_service = UserService(db_session)

    # Only update diagnosis, treatments should remain unchanged
    update_request = UserDataUpdateRequest(
        diagnosis="Chronic Lymphocytic Leukemia",
    )

    result = await user_service.update_user_data_by_id(str(user.id), update_request)

    assert result.user_data is not None
    assert result.user_data.diagnosis == "Chronic Lymphocytic Leukemia"
    # Verify treatments are preserved
    assert len(result.user_data.treatments) == 2
    treatment_names = {t.name for t in result.user_data.treatments}
    assert "Chemotherapy" in treatment_names
    assert "Radiation" in treatment_names


@pytest.mark.asyncio
async def test_update_creates_user_data_if_not_exists(db_session):
    """Test that update creates UserData if it doesn't exist"""
    user = User(
        id=uuid4(),
        auth_id="new-user-auth-id",
        email="newuser@example.com",
        role_id=1,
        first_name="New",
        last_name="User",
    )
    db_session.add(user)
    db_session.commit()

    user_service = UserService(db_session)

    update_request = UserDataUpdateRequest(
        first_name="Updated",
        diagnosis="Test Diagnosis",
    )

    result = await user_service.update_user_data_by_id(str(user.id), update_request)

    assert result.user_data is not None
    assert result.user_data.first_name == "Updated"
    assert result.user_data.diagnosis == "Test Diagnosis"


@pytest.mark.asyncio
async def test_update_with_invalid_treatment_name_ignores_it(db_session, test_user_with_data):
    """Test that invalid treatment names are ignored (not added)"""
    user, user_data = test_user_with_data
    user_service = UserService(db_session)

    # Mix valid and invalid treatment names
    update_request = UserDataUpdateRequest(
        treatments=["Chemotherapy", "Invalid Treatment Name", "Radiation"],
    )

    result = await user_service.update_user_data_by_id(str(user.id), update_request)

    assert result.user_data is not None
    treatment_names = {t.name for t in result.user_data.treatments}
    
    # Only valid treatments should be added
    assert "Chemotherapy" in treatment_names
    assert "Radiation" in treatment_names
    assert "Invalid Treatment Name" not in treatment_names
    assert len(treatment_names) == 2


@pytest.mark.asyncio
async def test_update_user_not_found_raises_error(db_session):
    """Test that updating non-existent user raises 404"""
    user_service = UserService(db_session)
    fake_user_id = str(uuid4())

    update_request = UserDataUpdateRequest(first_name="Test")

    with pytest.raises(Exception) as exc_info:
        await user_service.update_user_data_by_id(fake_user_id, update_request)
    
    assert "not found" in str(exc_info.value).lower() or exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_update_loved_one_fields(db_session, test_user_with_data):
    """Test updating loved one specific fields"""
    user, user_data = test_user_with_data
    user_service = UserService(db_session)

    update_request = UserDataUpdateRequest(
        loved_one_gender_identity="Female",
        loved_one_age="45",
        loved_one_diagnosis="Chronic Myeloid Leukemia",
        loved_one_date_of_diagnosis=date(2019, 6, 15),
    )

    result = await user_service.update_user_data_by_id(str(user.id), update_request)

    assert result.user_data is not None
    assert result.user_data.loved_one_gender_identity == "Female"
    assert result.user_data.loved_one_age == "45"
    assert result.user_data.loved_one_diagnosis == "Chronic Myeloid Leukemia"
    assert result.user_data.loved_one_date_of_diagnosis == date(2019, 6, 15)


@pytest.mark.asyncio
async def test_update_date_fields(db_session, test_user_with_data):
    """Test updating date fields"""
    user, user_data = test_user_with_data
    user_service = UserService(db_session)

    new_date = date(2021, 5, 20)
    update_request = UserDataUpdateRequest(
        date_of_birth=date(1985, 3, 10),
        date_of_diagnosis=new_date,
    )

    result = await user_service.update_user_data_by_id(str(user.id), update_request)

    assert result.user_data is not None
    assert result.user_data.date_of_birth == date(1985, 3, 10)
    assert result.user_data.date_of_diagnosis == new_date


# ========== AVAILABILITY TESTS ==========


@pytest.fixture
def volunteer_user(db_session):
    """Create a volunteer user for availability tests"""
    user = User(
        id=uuid4(),
        auth_id="volunteer-auth-id",
        email="volunteer@example.com",
        role_id=2,  # VOLUNTEER
        first_name="Volunteer",
        last_name="Test",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.mark.asyncio
async def test_create_availability_adds_templates(db_session, volunteer_user):
    """Test that creating availability adds templates correctly"""
    availability_service = AvailabilityService(db_session)
    
    # Create templates: Monday 10:00 AM to 11:30 AM
    templates = [
        AvailabilityTemplateSlot(
            day_of_week=0,  # Monday
            start_time=dt_time(10, 0),
            end_time=dt_time(11, 30),
        )
    ]
    
    create_request = CreateAvailabilityRequest(
        user_id=volunteer_user.id,
        templates=templates,
    )
    
    result = await availability_service.create_availability(create_request)
    
    assert result.user_id == volunteer_user.id
    assert result.added == 3  # 10:00, 10:30, 11:00 (3 templates)
    
    # Verify templates were created
    templates = db_session.query(AvailabilityTemplate).filter_by(user_id=volunteer_user.id).all()
    assert len(templates) == 3
    times = {t.start_time for t in templates}
    assert dt_time(10, 0) in times
    assert dt_time(10, 30) in times
    assert dt_time(11, 0) in times
    # All should be Monday (day_of_week 0)
    assert all(t.day_of_week == 0 for t in templates)


@pytest.mark.asyncio
async def test_create_availability_multiple_ranges(db_session, volunteer_user):
    """Test creating availability with multiple time ranges"""
    availability_service = AvailabilityService(db_session)
    
    templates = [
        AvailabilityTemplateSlot(
            day_of_week=0,  # Monday
            start_time=dt_time(9, 0),
            end_time=dt_time(10, 0),
        ),
        AvailabilityTemplateSlot(
            day_of_week=0,  # Monday
            start_time=dt_time(14, 0),
            end_time=dt_time(15, 0),
        ),
    ]
    
    create_request = CreateAvailabilityRequest(
        user_id=volunteer_user.id,
        templates=templates,
    )
    
    result = await availability_service.create_availability(create_request)
    
    # Should add 4 templates total (2 from each range)
    assert result.added == 4
    
    templates = db_session.query(AvailabilityTemplate).filter_by(user_id=volunteer_user.id).all()
    assert len(templates) == 4


@pytest.mark.asyncio
async def test_delete_availability_removes_templates(db_session, volunteer_user):
    """Test that deleting availability removes templates correctly"""
    availability_service = AvailabilityService(db_session)
    
    # First, create some availability
    templates = [
        AvailabilityTemplateSlot(
            day_of_week=0,  # Monday
            start_time=dt_time(10, 0),
            end_time=dt_time(12, 0),  # 10:00, 10:30, 11:00, 11:30
        )
    ]
    await availability_service.create_availability(
        CreateAvailabilityRequest(user_id=volunteer_user.id, templates=templates)
    )
    
    templates = db_session.query(AvailabilityTemplate).filter_by(user_id=volunteer_user.id).all()
    assert len(templates) == 4  # 10:00, 10:30, 11:00, 11:30
    
    # Now delete a portion of it (10:00 to 11:00, should remove 2 templates)
    delete_templates = [
        AvailabilityTemplateSlot(
            day_of_week=0,
            start_time=dt_time(10, 0),
            end_time=dt_time(11, 0),
        )
    ]
    
    delete_request = DeleteAvailabilityRequest(
        user_id=volunteer_user.id,
        templates=delete_templates,
    )
    
    result = await availability_service.delete_availability(delete_request)
    
    assert result.user_id == volunteer_user.id
    assert result.deleted == 2  # Removed 10:00 and 10:30
    
    # Verify remaining templates
    remaining = db_session.query(AvailabilityTemplate).filter_by(
        user_id=volunteer_user.id, is_active=True
    ).all()
    assert len(remaining) == 2  # Should have 11:00 and 11:30 left
    times = {t.start_time for t in remaining}
    assert dt_time(11, 0) in times
    assert dt_time(11, 30) in times


@pytest.mark.asyncio
async def test_delete_availability_ignores_non_existent(db_session, volunteer_user):
    """Test that deleting availability ignores non-existent templates"""
    availability_service = AvailabilityService(db_session)
    
    # Create some availability
    templates = [
        AvailabilityTemplateSlot(
            day_of_week=0,
            start_time=dt_time(10, 0),
            end_time=dt_time(11, 0),
        )
    ]
    await availability_service.create_availability(
        CreateAvailabilityRequest(user_id=volunteer_user.id, templates=templates)
    )
    
    templates = db_session.query(AvailabilityTemplate).filter_by(user_id=volunteer_user.id).all()
    assert len(templates) == 2
    
    # Try to delete templates that don't exist (Tuesday 14:00 to 15:00)
    delete_templates = [
        AvailabilityTemplateSlot(
            day_of_week=1,  # Tuesday (doesn't exist)
            start_time=dt_time(14, 0),
            end_time=dt_time(15, 0),
        )
    ]
    
    delete_request = DeleteAvailabilityRequest(
        user_id=volunteer_user.id,
        templates=delete_templates,
    )
    
    result = await availability_service.delete_availability(delete_request)
    
    # Should delete 0 templates since none exist
    assert result.deleted == 0
    
    # Verify original templates are still there
    remaining = db_session.query(AvailabilityTemplate).filter_by(
        user_id=volunteer_user.id, is_active=True
    ).all()
    assert len(remaining) == 2


@pytest.mark.asyncio
async def test_delete_all_availability(db_session, volunteer_user):
    """Test deleting all availability"""
    availability_service = AvailabilityService(db_session)
    
    # Create availability
    templates = [
        AvailabilityTemplateSlot(
            day_of_week=0,
            start_time=dt_time(10, 0),
            end_time=dt_time(12, 0),
        )
    ]
    await availability_service.create_availability(
        CreateAvailabilityRequest(user_id=volunteer_user.id, templates=templates)
    )
    
    templates = db_session.query(AvailabilityTemplate).filter_by(user_id=volunteer_user.id).all()
    assert len(templates) == 4
    
    # Delete all availability
    delete_templates = [
        AvailabilityTemplateSlot(
            day_of_week=0,
            start_time=dt_time(10, 0),
            end_time=dt_time(12, 0),
        )
    ]
    delete_request = DeleteAvailabilityRequest(
        user_id=volunteer_user.id,
        templates=delete_templates,
    )
    
    result = await availability_service.delete_availability(delete_request)
    
    assert result.deleted == 4
    
    # Verify all templates are removed
    remaining = db_session.query(AvailabilityTemplate).filter_by(
        user_id=volunteer_user.id, is_active=True
    ).all()
    assert len(remaining) == 0


@pytest.mark.asyncio
async def test_delete_availability_user_not_found(db_session):
    """Test that deleting availability raises error for non-existent user"""
    availability_service = AvailabilityService(db_session)
    
    fake_user_id = uuid4()
    delete_templates = [
        AvailabilityTemplateSlot(
            day_of_week=0,
            start_time=dt_time(10, 0),
            end_time=dt_time(11, 0),
        )
    ]
    
    delete_request = DeleteAvailabilityRequest(
        user_id=fake_user_id,
        templates=delete_templates,
    )
    
    with pytest.raises(Exception) as exc_info:
        await availability_service.delete_availability(delete_request)
    
    # The service currently raises 500 for user not found (could be improved to 404)
    assert exc_info.value.status_code == 500


@pytest.mark.asyncio
async def test_create_availability_user_not_found(db_session):
    """Test that creating availability raises error for non-existent user"""
    availability_service = AvailabilityService(db_session)
    
    fake_user_id = uuid4()
    templates = [
        AvailabilityTemplateSlot(
            day_of_week=0,
            start_time=dt_time(10, 0),
            end_time=dt_time(11, 0),
        )
    ]
    
    create_request = CreateAvailabilityRequest(
        user_id=fake_user_id,
        templates=templates,
    )
    
    with pytest.raises(Exception) as exc_info:
        await availability_service.create_availability(create_request)
    
    # The service currently raises 500 for user not found (could be improved to 404)
    assert exc_info.value.status_code == 500

