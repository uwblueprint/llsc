"""
Tests for AvailabilityService with the new template-based system.
Tests timezone handling, template creation, and projection.
"""

import os
from datetime import time as dt_time
from uuid import uuid4

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.models import AvailabilityTemplate, Role, User, UserData
from app.schemas.availability import (
    AvailabilityTemplateSlot,
    CreateAvailabilityRequest,
    DeleteAvailabilityRequest,
    GetAvailabilityRequest,
)
from app.schemas.user import UserRole
from app.services.implementations.availability_service import AvailabilityService

# Test DB Configuration
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
    session = TestingSessionLocal()

    try:
        # Clean up any existing data first
        session.execute(text("TRUNCATE TABLE availability_templates, user_data, users RESTART IDENTITY CASCADE"))
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
                session.add(role)
        session.commit()

        yield session
    finally:
        session.close()


@pytest.fixture
def volunteer_user(db_session):
    """Create a volunteer user with EST timezone"""
    user = User(
        id=uuid4(),
        email="volunteer@test.com",
        role_id=2,  # VOLUNTEER
        auth_id="auth_123",
        first_name="Test",
        last_name="Volunteer",
    )
    db_session.add(user)

    user_data = UserData(
        id=uuid4(),
        user_id=user.id,
        timezone="EST",
    )
    db_session.add(user_data)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def pst_volunteer(db_session):
    """Create a volunteer user with PST timezone"""
    user = User(
        id=uuid4(),
        email="pst_volunteer@test.com",
        role_id=2,  # VOLUNTEER
        auth_id="auth_456",
        first_name="PST",
        last_name="Volunteer",
    )
    db_session.add(user)

    user_data = UserData(
        id=uuid4(),
        user_id=user.id,
        timezone="PST",
    )
    db_session.add(user_data)
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
    assert all(t.is_active for t in templates)


@pytest.mark.asyncio
async def test_create_availability_replaces_existing(db_session, volunteer_user):
    """Test that creating availability replaces all existing templates"""
    availability_service = AvailabilityService(db_session)

    # Create initial templates
    templates1 = [
        AvailabilityTemplateSlot(
            day_of_week=0,  # Monday
            start_time=dt_time(10, 0),
            end_time=dt_time(11, 0),
        )
    ]
    await availability_service.create_availability(
        CreateAvailabilityRequest(user_id=volunteer_user.id, templates=templates1)
    )

    # Create new templates (should replace old ones)
    templates2 = [
        AvailabilityTemplateSlot(
            day_of_week=1,  # Tuesday
            start_time=dt_time(14, 0),
            end_time=dt_time(15, 0),
        )
    ]
    result = await availability_service.create_availability(
        CreateAvailabilityRequest(user_id=volunteer_user.id, templates=templates2)
    )

    assert result.added == 2  # 14:00, 14:30

    # Verify old templates are gone, new ones exist
    templates = db_session.query(AvailabilityTemplate).filter_by(user_id=volunteer_user.id).all()
    assert len(templates) == 2
    assert all(t.day_of_week == 1 for t in templates)  # All Tuesday
    times = {t.start_time for t in templates}
    assert dt_time(14, 0) in times
    assert dt_time(14, 30) in times


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

    assert result.added == 4  # 9:00, 9:30, 14:00, 14:30

    templates = db_session.query(AvailabilityTemplate).filter_by(user_id=volunteer_user.id).all()
    assert len(templates) == 4


@pytest.mark.asyncio
async def test_get_availability_returns_templates(db_session, volunteer_user):
    """Test that getting availability returns templates"""
    availability_service = AvailabilityService(db_session)

    # Create templates
    templates = [
        AvailabilityTemplateSlot(
            day_of_week=0,  # Monday
            start_time=dt_time(10, 0),
            end_time=dt_time(11, 0),
        )
    ]
    await availability_service.create_availability(
        CreateAvailabilityRequest(user_id=volunteer_user.id, templates=templates)
    )

    # Get availability
    get_request = GetAvailabilityRequest(user_id=volunteer_user.id)
    result = await availability_service.get_availability(get_request)

    assert result.user_id == volunteer_user.id
    # Service creates individual 30-minute templates, so 10:00-11:00 creates 2 templates (10:00-10:30, 10:30-11:00)
    assert len(result.templates) == 2
    assert all(t.day_of_week == 0 for t in result.templates)
    times = {t.start_time for t in result.templates}
    assert dt_time(10, 0) in times
    assert dt_time(10, 30) in times


@pytest.mark.asyncio
async def test_get_availability_only_active(db_session, volunteer_user):
    """Test that getting availability only returns active templates"""
    availability_service = AvailabilityService(db_session)

    # Create active template
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

    # Manually create inactive template
    inactive_template = AvailabilityTemplate(
        user_id=volunteer_user.id,
        day_of_week=1,
        start_time=dt_time(14, 0),
        end_time=dt_time(15, 0),
        is_active=False,
    )
    db_session.add(inactive_template)
    db_session.commit()

    # Get availability
    get_request = GetAvailabilityRequest(user_id=volunteer_user.id)
    result = await availability_service.get_availability(get_request)

    # Service creates 2 templates for 10:00-11:00 (30-minute blocks)
    assert len(result.templates) == 2
    assert all(t.day_of_week == 0 for t in result.templates)  # Only active templates


@pytest.mark.asyncio
async def test_delete_availability_removes_templates(db_session, volunteer_user):
    """Test that deleting availability removes templates correctly"""
    availability_service = AvailabilityService(db_session)

    # Create templates
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

    # Delete part of availability
    delete_templates = [
        AvailabilityTemplateSlot(
            day_of_week=0,
            start_time=dt_time(10, 0),
            end_time=dt_time(11, 0),  # Delete 10:00, 10:30
        )
    ]
    delete_request = DeleteAvailabilityRequest(
        user_id=volunteer_user.id,
        templates=delete_templates,
    )

    result = await availability_service.delete_availability(delete_request)

    assert result.deleted == 2
    assert len(result.templates) == 2  # Remaining: 11:00, 11:30

    # Verify remaining templates
    remaining = db_session.query(AvailabilityTemplate).filter_by(user_id=volunteer_user.id, is_active=True).all()
    assert len(remaining) == 2
    times = {t.start_time for t in remaining}
    assert dt_time(11, 0) in times
    assert dt_time(11, 30) in times


@pytest.mark.asyncio
async def test_delete_availability_ignores_non_existent(db_session, volunteer_user):
    """Test that deleting availability ignores non-existent templates"""
    availability_service = AvailabilityService(db_session)

    # Create some templates
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

    # Try to delete non-existent templates
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

    assert result.deleted == 0
    assert len(result.templates) == 2  # Original templates still there

    # Verify templates still exist
    remaining = db_session.query(AvailabilityTemplate).filter_by(user_id=volunteer_user.id, is_active=True).all()
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
    assert len(result.templates) == 0

    # Verify no templates remain
    remaining = db_session.query(AvailabilityTemplate).filter_by(user_id=volunteer_user.id, is_active=True).all()
    assert len(remaining) == 0


@pytest.mark.asyncio
async def test_create_availability_invalid_day_of_week(db_session, volunteer_user):
    """Test that invalid day_of_week raises error"""
    availability_service = AvailabilityService(db_session)

    templates = [
        AvailabilityTemplateSlot(
            day_of_week=7,  # Invalid (should be 0-6)
            start_time=dt_time(10, 0),
            end_time=dt_time(11, 0),
        )
    ]
    create_request = CreateAvailabilityRequest(
        user_id=volunteer_user.id,
        templates=templates,
    )

    with pytest.raises(Exception):  # Should raise HTTPException
        await availability_service.create_availability(create_request)


@pytest.mark.asyncio
async def test_create_availability_invalid_time_range(db_session, volunteer_user):
    """Test that invalid time range (end <= start) raises error"""
    availability_service = AvailabilityService(db_session)

    templates = [
        AvailabilityTemplateSlot(
            day_of_week=0,
            start_time=dt_time(11, 0),
            end_time=dt_time(10, 0),  # End before start
        )
    ]
    create_request = CreateAvailabilityRequest(
        user_id=volunteer_user.id,
        templates=templates,
    )

    with pytest.raises(Exception):  # Should raise HTTPException
        await availability_service.create_availability(create_request)


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

    with pytest.raises(Exception):  # Should raise HTTPException
        await availability_service.create_availability(create_request)


@pytest.mark.asyncio
async def test_pst_user_can_submit_8am_to_8pm(db_session, pst_volunteer):
    """Test that PST users can submit 8am-8pm PST templates"""
    availability_service = AvailabilityService(db_session)

    # PST user submits 8am-8pm PST
    templates = [
        AvailabilityTemplateSlot(
            day_of_week=0,  # Monday
            start_time=dt_time(8, 0),  # 8am PST
            end_time=dt_time(20, 0),  # 8pm PST
        )
    ]

    create_request = CreateAvailabilityRequest(
        user_id=pst_volunteer.id,
        templates=templates,
    )

    result = await availability_service.create_availability(create_request)

    # Should create 24 templates (8am-8pm in 30-min increments)
    assert result.added == 24

    # Verify templates stored as local time (not converted to UTC)
    templates = db_session.query(AvailabilityTemplate).filter_by(user_id=pst_volunteer.id, is_active=True).all()
    assert len(templates) == 24

    # Check first and last templates
    times = sorted([t.start_time for t in templates])
    assert times[0] == dt_time(8, 0)  # 8am PST
    assert times[-1] == dt_time(19, 30)  # 7:30pm PST (last 30-min block before 8pm)


@pytest.mark.asyncio
async def test_est_user_can_submit_8am_to_8pm(db_session, volunteer_user):
    """Test that EST users can submit 8am-8pm EST templates"""
    availability_service = AvailabilityService(db_session)

    # EST user submits 8am-8pm EST
    templates = [
        AvailabilityTemplateSlot(
            day_of_week=0,  # Monday
            start_time=dt_time(8, 0),  # 8am EST
            end_time=dt_time(20, 0),  # 8pm EST
        )
    ]

    create_request = CreateAvailabilityRequest(
        user_id=volunteer_user.id,
        templates=templates,
    )

    result = await availability_service.create_availability(create_request)

    # Should create 24 templates
    assert result.added == 24

    # Verify templates stored as local time
    templates = db_session.query(AvailabilityTemplate).filter_by(user_id=volunteer_user.id, is_active=True).all()
    assert len(templates) == 24

    times = sorted([t.start_time for t in templates])
    assert times[0] == dt_time(8, 0)  # 8am EST
    assert times[-1] == dt_time(19, 30)  # 7:30pm EST
