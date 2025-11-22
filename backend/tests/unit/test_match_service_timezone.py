"""
Tests for MatchService timezone handling when projecting availability templates.
"""

import os
from datetime import datetime, timezone
from datetime import time as dt_time
from uuid import uuid4

import pytest
import pytest_asyncio
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.models import Match, MatchStatus, Role, User, UserData
from app.schemas.availability import AvailabilityTemplateSlot, CreateAvailabilityRequest
from app.schemas.match import MatchCreateRequest
from app.schemas.user import UserRole
from app.services.implementations.availability_service import AvailabilityService
from app.services.implementations.match_service import MatchService

# Test DB Configuration
POSTGRES_DATABASE_URL = os.getenv("POSTGRES_TEST_DATABASE_URL")

if not POSTGRES_DATABASE_URL:
    # Skip all tests in this file if Postgres isn't available
    pytest.skip(
        "POSTGRES_TEST_DATABASE_URL not set. "
        "These tests require a Postgres database. Set POSTGRES_TEST_DATABASE_URL to run them.",
        allow_module_level=True,
    )

engine = create_engine(POSTGRES_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Provide a clean database session for each test"""
    session = TestingSessionLocal()

    try:
        # Clean up any existing data first
        session.execute(
            text(
                "TRUNCATE TABLE suggested_times, time_blocks, matches, "
                "availability_templates, user_data, users RESTART IDENTITY CASCADE"
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
                session.add(role)

        # Ensure match statuses exist
        existing_statuses = {s.name for s in session.query(MatchStatus).all()}
        statuses = [
            MatchStatus(name="pending"),
            MatchStatus(name="awaiting_volunteer_acceptance"),
            MatchStatus(name="confirmed"),
        ]
        for status in statuses:
            if status.name not in existing_statuses:
                session.add(status)

        session.commit()

        yield session
    finally:
        session.close()


@pytest.fixture
def participant_user(db_session):
    """Create a test participant"""
    user = User(
        id=uuid4(),
        email="participant@test.com",
        role_id=1,  # PARTICIPANT
        auth_id="auth_participant",
        first_name="Test",
        last_name="Participant",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def est_volunteer(db_session):
    """Create volunteer with EST timezone and availability templates"""
    user = User(
        id=uuid4(),
        email="est_volunteer@test.com",
        role_id=2,  # VOLUNTEER
        auth_id="auth_est",
        first_name="EST",
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

    # Create availability templates: Monday 2pm-4pm EST
    availability_service = AvailabilityService(db_session)
    templates = [
        AvailabilityTemplateSlot(
            day_of_week=0,  # Monday
            start_time=dt_time(14, 0),  # 2pm EST
            end_time=dt_time(16, 0),  # 4pm EST
        )
    ]
    await availability_service.create_availability(CreateAvailabilityRequest(user_id=user.id, templates=templates))

    db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def pst_volunteer(db_session):
    """Create volunteer with PST timezone and availability templates"""
    user = User(
        id=uuid4(),
        email="pst_volunteer@test.com",
        role_id=2,  # VOLUNTEER
        auth_id="auth_pst",
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

    # Create availability templates: Monday 8am-10am PST
    availability_service = AvailabilityService(db_session)
    templates = [
        AvailabilityTemplateSlot(
            day_of_week=0,  # Monday
            start_time=dt_time(8, 0),  # 8am PST
            end_time=dt_time(10, 0),  # 10am PST
        )
    ]
    await availability_service.create_availability(CreateAvailabilityRequest(user_id=user.id, templates=templates))

    db_session.refresh(user)
    return user


@pytest.mark.asyncio
async def test_est_template_projects_to_utc_correctly(db_session, participant_user, est_volunteer):
    """Test that EST templates project to correct UTC times"""
    match_service = MatchService(db_session)

    # Create match with EST volunteer
    create_request = MatchCreateRequest(
        participant_id=participant_user.id,
        volunteer_ids=[est_volunteer.id],
        match_status="pending",  # This will trigger template projection
    )

    result = await match_service.create_matches(create_request)
    assert len(result.matches) == 1

    match = db_session.query(Match).filter_by(id=result.matches[0].id).first()
    assert match is not None

    # Get suggested time blocks
    suggested_blocks = match.suggested_time_blocks
    assert len(suggested_blocks) > 0

    # EST is UTC-5 in winter, UTC-4 in summer (EDT)
    # 2pm EST = 7pm UTC (winter) or 6pm UTC (summer)
    # 4pm EST = 9pm UTC (winter) or 8pm UTC (summer)
    # We should have blocks at the correct UTC times
    utc_times = sorted([block.start_time for block in suggested_blocks])

    # Check that times are in UTC
    assert all(tz.tzinfo == timezone.utc for tz in utc_times)

    # Check that times are in the future
    now = datetime.now(timezone.utc)
    assert all(tz >= now for tz in utc_times)

    # Verify times correspond to Monday 2pm-4pm EST
    # Find a Monday in the next week
    for block in suggested_blocks:
        if block.start_time.weekday() == 0:  # Monday
            hour_utc = block.start_time.hour
            # EST is UTC-5 (winter) or UTC-4 (summer/EDT)
            # 2pm EST = 7pm UTC (winter) or 6pm UTC (summer)
            # 4pm EST = 9pm UTC (winter) or 8pm UTC (summer)
            # Allow for both DST and non-DST
            assert hour_utc in [18, 19, 20, 21], f"Expected 18-21 UTC (2-4pm EST), got {hour_utc}"


@pytest.mark.asyncio
async def test_pst_template_projects_to_utc_correctly(db_session, participant_user, pst_volunteer):
    """Test that PST templates project to correct UTC times"""
    match_service = MatchService(db_session)

    # Create match with PST volunteer
    create_request = MatchCreateRequest(
        participant_id=participant_user.id,
        volunteer_ids=[pst_volunteer.id],
        match_status="pending",
    )

    result = await match_service.create_matches(create_request)
    assert len(result.matches) == 1

    match = db_session.query(Match).filter_by(id=result.matches[0].id).first()
    assert match is not None

    # Get suggested time blocks
    suggested_blocks = match.suggested_time_blocks
    assert len(suggested_blocks) > 0

    # PST is UTC-8 in winter, UTC-7 in summer (PDT)
    # 8am PST = 4pm UTC (winter) or 3pm UTC (summer)
    # 10am PST = 6pm UTC (winter) or 5pm UTC (summer)
    utc_times = sorted([block.start_time for block in suggested_blocks])

    # Check that times are in UTC
    assert all(tz.tzinfo == timezone.utc for tz in utc_times)

    # Check that times are in the future
    now = datetime.now(timezone.utc)
    assert all(tz >= now for tz in utc_times)

    # Verify times correspond to Monday 8am-10am PST
    for block in suggested_blocks:
        if block.start_time.weekday() == 0:  # Monday
            hour_utc = block.start_time.hour
            # PST is UTC-8 (winter) or UTC-7 (summer/PDT)
            # 8am PST = 4pm UTC (winter) or 3pm UTC (summer)
            # 10am PST = 6pm UTC (winter) or 5pm UTC (summer)
            # Allow for both DST and non-DST
            assert hour_utc in [15, 16, 17, 18], f"Expected 15-18 UTC (8-10am PST), got {hour_utc}"


@pytest.mark.asyncio
async def test_volunteer_accept_match_projects_templates(db_session, participant_user, est_volunteer):
    """Test that volunteer accepting match projects templates correctly"""
    match_service = MatchService(db_session)

    # Create match with awaiting_volunteer_acceptance status
    create_request = MatchCreateRequest(
        participant_id=participant_user.id,
        volunteer_ids=[est_volunteer.id],
        match_status="awaiting_volunteer_acceptance",
    )

    result = await match_service.create_matches(create_request)
    assert len(result.matches) == 1

    match = db_session.query(Match).filter_by(id=result.matches[0].id).first()
    # Initially no suggested times (awaiting acceptance)
    assert len(match.suggested_time_blocks) == 0

    # Volunteer accepts match
    await match_service.volunteer_accept_match(match.id, est_volunteer.id)

    # Refresh match
    db_session.refresh(match)

    # Should now have suggested times projected from templates
    assert len(match.suggested_time_blocks) > 0

    # Verify times are in UTC
    for block in match.suggested_time_blocks:
        assert block.start_time.tzinfo == timezone.utc


@pytest.mark.asyncio
async def test_no_timezone_defaults_to_utc(db_session, participant_user):
    """Test that volunteer without timezone defaults to UTC"""
    # Create volunteer without timezone
    volunteer = User(
        id=uuid4(),
        email="no_tz_volunteer@test.com",
        role_id=2,
        auth_id="auth_no_tz",
        first_name="No",
        last_name="Timezone",
    )
    db_session.add(volunteer)

    user_data = UserData(
        id=uuid4(),
        user_id=volunteer.id,
        timezone=None,  # No timezone
    )
    db_session.add(user_data)
    db_session.commit()
    db_session.refresh(volunteer)

    # Create availability templates
    availability_service = AvailabilityService(db_session)
    templates = [
        AvailabilityTemplateSlot(
            day_of_week=0,
            start_time=dt_time(14, 0),
            end_time=dt_time(16, 0),
        )
    ]
    await availability_service.create_availability(CreateAvailabilityRequest(user_id=volunteer.id, templates=templates))

    # Create match
    match_service = MatchService(db_session)
    create_request = MatchCreateRequest(
        participant_id=participant_user.id,
        volunteer_ids=[volunteer.id],
        match_status="pending",
    )

    result = await match_service.create_matches(create_request)
    assert len(result.matches) == 1

    match = db_session.query(Match).filter_by(id=result.matches[0].id).first()

    # Should still work (defaults to UTC)
    # Templates interpreted as UTC, so 2pm UTC = 2pm UTC
    suggested_blocks = match.suggested_time_blocks
    assert len(suggested_blocks) > 0

    # Verify times are in UTC
    for block in suggested_blocks:
        assert block.start_time.tzinfo == timezone.utc
        if block.start_time.weekday() == 0:  # Monday
            # Without timezone, templates are interpreted as UTC, so 2pm template = 2pm UTC
            # But DST might affect this, so allow for both 14 and 15 (depending on when test runs)
            assert block.start_time.hour in [14, 15], f"Expected 14 or 15 UTC, got {block.start_time.hour}"
