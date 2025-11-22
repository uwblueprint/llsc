"""Integration tests for MatchService.

Tests all match service methods with a real database.

NOTE: These tests are designed to work with BOTH Postgres and SQLite.
- If POSTGRES_TEST_DATABASE_URL is set: Uses Postgres (like test_user.py)
- Otherwise: Skips tests with a message to run unit tests for TimeRange validation only

For full test coverage, set up Postgres test DB or run validation tests only.
"""

import os
from datetime import datetime, timedelta, timezone
from uuid import UUID

import pytest
import pytest_asyncio
from fastapi import HTTPException
from sqlalchemy import create_engine, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from app.models import Match, MatchStatus, Role, TimeBlock, User, UserData
from app.schemas.availability import AvailabilityTemplateSlot, CreateAvailabilityRequest
from app.schemas.match import (
    MatchCreateRequest,
    MatchRequestNewVolunteersResponse,
    MatchUpdateRequest,
)
from app.schemas.time_block import TimeRange
from app.schemas.user import UserRole
from app.services.implementations.availability_service import AvailabilityService
from app.services.implementations.match_service import MatchService

# Check for Postgres test database (same pattern as test_user.py)
POSTGRES_DATABASE_URL = os.getenv("POSTGRES_TEST_DATABASE_URL")

if not POSTGRES_DATABASE_URL:
    # Skip all tests in this file if Postgres isn't available
    pytest.skip(
        "POSTGRES_TEST_DATABASE_URL not set. "
        "Run TimeRange validation tests only: pytest tests/unit/test_time_block_validation.py",
        allow_module_level=True,
    )

engine = create_engine(POSTGRES_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Provide a clean database session for each test (Postgres only).

    Assumes Alembic migrations have run. Seeds roles and match statuses.
    """
    session = TestingSessionLocal()

    try:
        # Clean up match-related data (be careful with FK constraints)
        session.execute(
            text(
                "TRUNCATE TABLE suggested_times, availability_templates, matches, time_blocks, tasks RESTART IDENTITY CASCADE"
            )
        )
        session.execute(text("TRUNCATE TABLE users RESTART IDENTITY CASCADE"))
        session.commit()

        # Seed roles if missing
        existing_roles = {r.id for r in session.query(Role).all()}
        seed_roles = [
            Role(id=1, name=UserRole.PARTICIPANT),
            Role(id=2, name=UserRole.VOLUNTEER),
            Role(id=3, name=UserRole.ADMIN),
        ]
        for role in seed_roles:
            if role.id not in existing_roles:
                try:
                    session.add(role)
                    session.commit()
                except IntegrityError:
                    session.rollback()

        # Seed match statuses - always ensure they exist
        existing_statuses = {s.name for s in session.query(MatchStatus).all()}
        existing_status_ids = {s.id for s in session.query(MatchStatus).all()}
        seed_statuses = [
            MatchStatus(id=1, name="pending"),
            MatchStatus(id=2, name="confirmed"),
            MatchStatus(id=3, name="cancelled_by_participant"),
            MatchStatus(id=4, name="completed"),
            MatchStatus(id=5, name="no_show"),
            MatchStatus(id=6, name="rescheduled"),
            MatchStatus(id=7, name="cancelled_by_volunteer"),
            MatchStatus(id=8, name="requesting_new_times"),
            MatchStatus(id=9, name="requesting_new_volunteers"),
            MatchStatus(id=10, name="awaiting_volunteer_acceptance"),
        ]
        for status in seed_statuses:
            if status.name not in existing_statuses:
                # If ID exists but name doesn't match, update it
                if status.id in existing_status_ids:
                    existing = session.query(MatchStatus).filter_by(id=status.id).first()
                    if existing:
                        existing.name = status.name
                else:
                    session.add(status)
        session.commit()  # Commit all statuses at once

        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture
def participant_user(db_session):
    """Create a test participant."""
    user = User(
        first_name="Test",
        last_name="Participant",
        email="participant@example.com",
        role_id=1,
        auth_id="participant_auth_id",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def another_participant(db_session):
    """Create another participant for ownership tests."""
    user = User(
        first_name="Another",
        last_name="Participant",
        email="participant2@example.com",
        role_id=1,
        auth_id="participant2_auth_id",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def volunteer_user(db_session):
    """Create a test volunteer without availability."""
    user = User(
        first_name="Test",
        last_name="Volunteer",
        email="volunteer@example.com",
        role_id=2,
        auth_id="volunteer_auth_id",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def another_volunteer(db_session):
    """Create another volunteer for testing."""
    user = User(
        first_name="Another",
        last_name="Volunteer",
        email="volunteer2@example.com",
        role_id=2,
        auth_id="volunteer2_auth_id",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def volunteer_with_availability(db_session, volunteer_user):
    """Create volunteer with availability templates."""
    # Create user_data with EST timezone
    user_data = UserData(
        user_id=volunteer_user.id,
        timezone="EST",
    )
    db_session.add(user_data)
    db_session.commit()
    db_session.refresh(volunteer_user)

    # Create availability templates: Monday 10:00-12:00 EST
    availability_service = AvailabilityService(db_session)
    templates = [
        AvailabilityTemplateSlot(
            day_of_week=0,  # Monday
            start_time=datetime(2000, 1, 1, 10, 0).time(),  # 10:00
            end_time=datetime(2000, 1, 1, 12, 0).time(),  # 12:00
        )
    ]
    await availability_service.create_availability(
        CreateAvailabilityRequest(user_id=volunteer_user.id, templates=templates)
    )

    db_session.refresh(volunteer_user)
    return volunteer_user


@pytest_asyncio.fixture
async def volunteer_with_mixed_availability(db_session, another_volunteer):
    """Create volunteer with availability templates."""
    # Create user_data with EST timezone
    user_data = UserData(
        user_id=another_volunteer.id,
        timezone="EST",
    )
    db_session.add(user_data)
    db_session.commit()
    db_session.refresh(another_volunteer)

    # Create availability templates: Tuesday 14:00-15:00 EST
    availability_service = AvailabilityService(db_session)
    templates = [
        AvailabilityTemplateSlot(
            day_of_week=1,  # Tuesday
            start_time=datetime(2000, 1, 1, 14, 0).time(),  # 14:00
            end_time=datetime(2000, 1, 1, 15, 0).time(),  # 15:00
        )
    ]
    await availability_service.create_availability(
        CreateAvailabilityRequest(user_id=another_volunteer.id, templates=templates)
    )

    db_session.refresh(another_volunteer)
    return another_volunteer


@pytest_asyncio.fixture
async def volunteer_with_alt_availability(db_session):
    """Create a different volunteer with distinct availability templates."""
    volunteer = User(
        first_name="Alt",
        last_name="Volunteer",
        email="volunteer_alt@example.com",
        role_id=2,
        auth_id="volunteer_alt_auth_id",
    )
    db_session.add(volunteer)
    db_session.flush()

    # Create user_data with EST timezone
    user_data = UserData(
        user_id=volunteer.id,
        timezone="EST",
    )
    db_session.add(user_data)
    db_session.commit()
    db_session.refresh(volunteer)

    # Create availability templates: Wednesday 9:00-10:00 EST
    availability_service = AvailabilityService(db_session)
    templates = [
        AvailabilityTemplateSlot(
            day_of_week=2,  # Wednesday
            start_time=datetime(2000, 1, 1, 9, 0).time(),  # 9:00
            end_time=datetime(2000, 1, 1, 10, 0).time(),  # 10:00
        )
    ]
    await availability_service.create_availability(CreateAvailabilityRequest(user_id=volunteer.id, templates=templates))

    db_session.commit()
    db_session.refresh(volunteer)
    return volunteer


@pytest.fixture
def sample_match(db_session, participant_user, volunteer_user):
    """Create a pending match with suggested times."""
    match = Match(
        participant_id=participant_user.id,
        volunteer_id=volunteer_user.id,
        match_status_id=1,  # pending
    )
    db_session.add(match)
    db_session.flush()

    # Add suggested times
    now = datetime.now(timezone.utc)
    tomorrow = now + timedelta(days=1)
    times = [
        tomorrow.replace(hour=14, minute=0, second=0, microsecond=0),
        tomorrow.replace(hour=14, minute=30, second=0, microsecond=0),
        tomorrow.replace(hour=15, minute=0, second=0, microsecond=0),
    ]

    for time in times:
        block = TimeBlock(start_time=time)
        match.suggested_time_blocks.append(block)

    db_session.commit()
    db_session.refresh(match)
    return match


# ========== CREATE MATCHES TESTS ==========


class TestCreateMatches:
    """Test match creation functionality."""

    @pytest.mark.asyncio
    async def test_create_match_success(self, db_session, participant_user, volunteer_user):
        """Admin can create a match successfully"""
        try:
            match_service = MatchService(db_session)
            request = MatchCreateRequest(
                participant_id=participant_user.id,
                volunteer_ids=[volunteer_user.id],
            )

            response = await match_service.create_matches(request)

            assert len(response.matches) == 1
            assert response.matches[0].participant_id == participant_user.id
            assert response.matches[0].volunteer_id == volunteer_user.id
            assert response.matches[0].match_status == "awaiting_volunteer_acceptance"

            match = db_session.get(Match, response.matches[0].id)
            assert match is not None
            assert match.match_status.name == "awaiting_volunteer_acceptance"
            assert len(match.suggested_time_blocks) == 0

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_create_match_copies_volunteer_availability(
        self, db_session, participant_user, volunteer_with_availability
    ):
        """Match should copy volunteer's availability as suggested times"""
        try:
            match_service = MatchService(db_session)
            request = MatchCreateRequest(
                participant_id=participant_user.id,
                volunteer_ids=[volunteer_with_availability.id],
            )

            response = await match_service.create_matches(request)
            match_id = response.matches[0].id

            match = db_session.get(Match, match_id)
            assert match is not None
            assert match.match_status.name == "awaiting_volunteer_acceptance"
            assert len(match.suggested_time_blocks) == 0

            detail = await match_service.volunteer_accept_match(match_id, volunteer_with_availability.id)
            assert detail.match_status == "pending"
            # Templates project to next week, so 10:00-12:00 Monday = 4 blocks per week = 4 blocks
            assert len(detail.suggested_time_blocks) == 4

            db_session.refresh(match)
            assert match.match_status.name == "pending"
            # Templates project to next week, so 10:00-12:00 Monday = 4 blocks per week = 4 blocks
            assert len(match.suggested_time_blocks) == 4

            for block in match.suggested_time_blocks:
                assert block.start_time.minute in {0, 30}

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_create_match_filters_past_and_invalid_times(
        self, db_session, participant_user, volunteer_with_mixed_availability
    ):
        """Should filter out past times and non-half-hour times"""
        try:
            match_service = MatchService(db_session)
            request = MatchCreateRequest(
                participant_id=participant_user.id,
                volunteer_ids=[volunteer_with_mixed_availability.id],
            )

            response = await match_service.create_matches(request)
            match_id = response.matches[0].id

            match = db_session.get(Match, match_id)
            assert match is not None
            assert len(match.suggested_time_blocks) == 0

            detail = await match_service.volunteer_accept_match(match_id, volunteer_with_mixed_availability.id)
            assert len(detail.suggested_time_blocks) == 2

            # Should only have 2 valid future times (14:00, 14:30)
            # Past time and :15 time should be filtered out
            db_session.refresh(match)
            assert len(match.suggested_time_blocks) == 2

            # Verify all are at :00 or :30
            for block in match.suggested_time_blocks:
                assert block.start_time.minute in {0, 30}

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_create_multiple_matches_for_participant(
        self, db_session, participant_user, volunteer_user, another_volunteer
    ):
        """Can create multiple matches for same participant"""
        try:
            match_service = MatchService(db_session)
            request = MatchCreateRequest(
                participant_id=participant_user.id,
                volunteer_ids=[volunteer_user.id, another_volunteer.id],
            )

            response = await match_service.create_matches(request)

            assert len(response.matches) == 2
            assert all(m.participant_id == participant_user.id for m in response.matches)

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_create_match_with_custom_status(self, db_session, participant_user, volunteer_user):
        """Can create match with custom status"""
        try:
            match_service = MatchService(db_session)
            request = MatchCreateRequest(
                participant_id=participant_user.id,
                volunteer_ids=[volunteer_user.id],
                match_status="confirmed",
            )

            response = await match_service.create_matches(request)

            assert response.matches[0].match_status == "confirmed"

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_create_match_with_pending_status_copies_availability(
        self, db_session, participant_user, volunteer_with_availability
    ):
        """Explicit pending status copies volunteer availability immediately."""
        try:
            match_service = MatchService(db_session)
            request = MatchCreateRequest(
                participant_id=participant_user.id,
                volunteer_ids=[volunteer_with_availability.id],
                match_status="pending",
            )

            response = await match_service.create_matches(request)
            match_id = response.matches[0].id

            match = db_session.get(Match, match_id)
            assert match is not None
            assert match.match_status.name == "pending"
            # Templates project to next week, so 10:00-12:00 Monday = 4 blocks per week = 4 blocks
            assert len(match.suggested_time_blocks) == 4

            for block in match.suggested_time_blocks:
                assert block.start_time.minute in {0, 30}

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_create_match_invalid_participant_404(self, db_session, volunteer_user):
        """404 when participant doesn't exist"""
        match_service = MatchService(db_session)
        request = MatchCreateRequest(
            participant_id=UUID("00000000-0000-0000-0000-000000000000"),
            volunteer_ids=[volunteer_user.id],
        )

        with pytest.raises(HTTPException) as exc_info:
            await match_service.create_matches(request)

        assert exc_info.value.status_code == 404
        assert "Participant" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_create_match_invalid_volunteer_404(self, db_session, participant_user):
        """404 when volunteer doesn't exist"""
        match_service = MatchService(db_session)
        request = MatchCreateRequest(
            participant_id=participant_user.id,
            volunteer_ids=[UUID("00000000-0000-0000-0000-000000000000")],
        )

        with pytest.raises(HTTPException) as exc_info:
            await match_service.create_matches(request)

        assert exc_info.value.status_code == 404
        assert "Volunteer" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_create_match_participant_has_wrong_role_400(self, db_session, volunteer_user):
        """400 when trying to use volunteer as participant"""
        match_service = MatchService(db_session)
        # Try to use volunteer as participant
        request = MatchCreateRequest(
            participant_id=volunteer_user.id,
            volunteer_ids=[volunteer_user.id],
        )

        with pytest.raises(HTTPException) as exc_info:
            await match_service.create_matches(request)

        assert exc_info.value.status_code == 400
        assert "not a participant" in exc_info.value.detail.lower()


# ========== GET MATCHES TESTS ==========


class TestGetMatches:
    """Test retrieving matches."""

    @pytest.mark.asyncio
    async def test_get_matches_for_participant(self, db_session, sample_match, participant_user):
        """Can retrieve all matches for participant"""
        try:
            match_service = MatchService(db_session)

            response = await match_service.get_matches_for_participant(participant_user.id)

            assert len(response.matches) == 1
            assert response.matches[0].participant_id == participant_user.id

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_get_matches_includes_volunteer_info(self, db_session, sample_match):
        """Response includes volunteer name, email"""
        try:
            match_service = MatchService(db_session)

            response = await match_service.get_matches_for_participant(sample_match.participant_id)

            match = response.matches[0]
            assert match.volunteer.first_name == "Test"
            assert match.volunteer.last_name == "Volunteer"
            assert match.volunteer.email == "volunteer@example.com"

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_get_matches_includes_suggested_times(self, db_session, sample_match):
        """Response includes suggested time blocks"""
        try:
            match_service = MatchService(db_session)

            response = await match_service.get_matches_for_participant(sample_match.participant_id)

            match = response.matches[0]
            assert len(match.suggested_time_blocks) == 3
            # Verify sorted by start_time
            times = [block.start_time for block in match.suggested_time_blocks]
            assert times == sorted(times)

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_get_matches_empty_for_different_participant(self, db_session, sample_match, another_participant):
        """Different participant gets empty list"""
        try:
            match_service = MatchService(db_session)

            response = await match_service.get_matches_for_participant(another_participant.id)

            assert len(response.matches) == 0

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_get_matches_ordered_by_created_at_desc(
        self, db_session, participant_user, volunteer_user, another_volunteer
    ):
        """Matches returned in descending order by creation time"""
        try:
            match_service = MatchService(db_session)

            # Create two matches with slight delay (explicitly set to pending so participants can see them)
            request1 = MatchCreateRequest(
                participant_id=participant_user.id,
                volunteer_ids=[volunteer_user.id],
                match_status="pending",
            )
            await match_service.create_matches(request1)

            request2 = MatchCreateRequest(
                participant_id=participant_user.id,
                volunteer_ids=[another_volunteer.id],
                match_status="pending",
            )
            await match_service.create_matches(request2)

            response = await match_service.get_matches_for_participant(participant_user.id)

            assert len(response.matches) == 2
            # Most recent first
            assert response.matches[0].volunteer.email == "volunteer2@example.com"
            assert response.matches[1].volunteer.email == "volunteer@example.com"

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise


# ========== SCHEDULE MATCH TESTS ==========


class TestScheduleMatch:
    """Test scheduling a match."""

    @pytest.mark.asyncio
    async def test_schedule_match_success(self, db_session, sample_match, participant_user):
        """Participant can schedule a call"""
        try:
            match_service = MatchService(db_session)
            time_block_id = sample_match.suggested_time_blocks[0].id

            response = await match_service.schedule_match(
                sample_match.id, time_block_id, acting_participant_id=participant_user.id
            )

            assert response.id == sample_match.id
            assert response.chosen_time_block is not None
            assert response.chosen_time_block.id == time_block_id

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_schedule_match_sets_chosen_time(self, db_session, sample_match, participant_user):
        """Scheduling sets chosen_time_block_id"""
        try:
            match_service = MatchService(db_session)
            time_block_id = sample_match.suggested_time_blocks[0].id

            await match_service.schedule_match(
                sample_match.id, time_block_id, acting_participant_id=participant_user.id
            )

            # Refresh and verify
            db_session.refresh(sample_match)
            assert sample_match.chosen_time_block_id == time_block_id
            assert sample_match.confirmed_time is not None

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_schedule_match_changes_status_to_confirmed(self, db_session, sample_match, participant_user):
        """Status becomes 'confirmed'"""
        try:
            match_service = MatchService(db_session)
            time_block_id = sample_match.suggested_time_blocks[0].id

            await match_service.schedule_match(
                sample_match.id, time_block_id, acting_participant_id=participant_user.id
            )

            db_session.refresh(sample_match)
            assert sample_match.match_status.name == "confirmed"

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_schedule_match_deletes_other_matches(
        self, db_session, participant_user, volunteer_user, another_volunteer
    ):
        """Scheduling one match soft-deletes other active matches"""
        try:
            match_service = MatchService(db_session)

            # Create 2 matches for same participant
            request = MatchCreateRequest(
                participant_id=participant_user.id,
                volunteer_ids=[volunteer_user.id, another_volunteer.id],
            )
            response = await match_service.create_matches(request)

            match1_id = response.matches[0].id
            match2_id = response.matches[1].id

            # Get a time block from match1
            match1 = db_session.get(Match, match1_id)
            time_block_id = match1.suggested_time_blocks[0].id if match1.suggested_time_blocks else None

            # Need to add a time block if none exists
            if not time_block_id:
                now = datetime.now(timezone.utc)
                tomorrow = now + timedelta(days=1)
                block = TimeBlock(start_time=tomorrow.replace(hour=10, minute=0, second=0, microsecond=0))
                match1.suggested_time_blocks.append(block)
                db_session.commit()
                db_session.refresh(match1)
                time_block_id = match1.suggested_time_blocks[0].id

            # Schedule match1
            await match_service.schedule_match(match1_id, time_block_id, acting_participant_id=participant_user.id)

            # Verify match1 is confirmed
            match1 = db_session.get(Match, match1_id)
            assert match1 is not None
            assert match1.match_status.name == "confirmed"

            # Verify match2 is soft-deleted, not removed
            match2 = db_session.get(Match, match2_id)
            assert match2 is not None
            assert match2.deleted_at is not None

            # Verify only 1 active match remains for participant
            participant_matches = (
                db_session.query(Match)
                .filter(Match.participant_id == participant_user.id, Match.deleted_at.is_(None))
                .all()
            )
            assert len(participant_matches) == 1

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_schedule_match_retains_historical_matches(
        self, db_session, participant_user, volunteer_user, another_volunteer
    ):
        """Historical matches (e.g., completed) remain after scheduling a new match"""
        try:
            match_service = MatchService(db_session)

            # Create pending match with volunteer 1
            await match_service.create_matches(
                MatchCreateRequest(participant_id=participant_user.id, volunteer_ids=[volunteer_user.id])
            )
            pending_match = (
                db_session.query(Match)
                .filter(Match.participant_id == participant_user.id, Match.deleted_at.is_(None))
                .order_by(Match.id)
                .first()
            )

            if not pending_match.suggested_time_blocks:
                kickoff = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0) + timedelta(days=1)
                pending_match.suggested_time_blocks.append(TimeBlock(start_time=kickoff))
                db_session.commit()
                db_session.refresh(pending_match)

            # Create second match and mark as completed
            await match_service.create_matches(
                MatchCreateRequest(participant_id=participant_user.id, volunteer_ids=[another_volunteer.id])
            )
            completed_match = (
                db_session.query(Match)
                .filter(Match.participant_id == participant_user.id, Match.id != pending_match.id)
                .first()
            )
            completed_status = db_session.query(MatchStatus).filter_by(name="completed").one()
            completed_match.match_status = completed_status
            db_session.commit()

            # Schedule the pending match
            time_block_id = pending_match.suggested_time_blocks[0].id
            await match_service.schedule_match(
                pending_match.id, time_block_id, acting_participant_id=participant_user.id
            )

            db_session.refresh(completed_match)
            assert completed_match.deleted_at is None
            assert completed_match.match_status.name == "completed"

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_schedule_match_participant_ownership_check(self, db_session, sample_match, another_participant):
        """403 when different participant tries to schedule"""
        match_service = MatchService(db_session)
        time_block_id = sample_match.suggested_time_blocks[0].id

        with pytest.raises(HTTPException) as exc_info:
            await match_service.schedule_match(
                sample_match.id, time_block_id, acting_participant_id=another_participant.id
            )

        assert exc_info.value.status_code == 403
        assert "Cannot modify another participant" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_schedule_match_admin_can_bypass_ownership(self, db_session, sample_match):
        """Admin can schedule on behalf (acting_participant_id=None)"""
        try:
            match_service = MatchService(db_session)
            time_block_id = sample_match.suggested_time_blocks[0].id

            # Admin bypasses by passing None
            response = await match_service.schedule_match(sample_match.id, time_block_id, acting_participant_id=None)

            assert response.match_status == "confirmed"

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_schedule_match_invalid_time_block_404(self, db_session, sample_match, participant_user):
        """404 when time block doesn't exist"""
        match_service = MatchService(db_session)

        with pytest.raises(HTTPException) as exc_info:
            await match_service.schedule_match(sample_match.id, 99999, acting_participant_id=participant_user.id)

        assert exc_info.value.status_code == 404
        assert "TimeBlock" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_schedule_match_invalid_match_404(self, db_session, participant_user):
        """404 when match doesn't exist"""
        match_service = MatchService(db_session)

        with pytest.raises(HTTPException) as exc_info:
            await match_service.schedule_match(99999, 1, acting_participant_id=participant_user.id)

        assert exc_info.value.status_code == 404
        assert "Match" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_schedule_match_rejects_block_not_in_suggested_times(
        self, db_session, sample_match, participant_user
    ):
        """400 when trying to book a time block not in match's suggested times"""
        try:
            match_service = MatchService(db_session)

            # Create a different time block not in sample_match's suggested times
            now = datetime.now(timezone.utc)
            tomorrow = now + timedelta(days=1)
            other_block = TimeBlock(start_time=tomorrow.replace(hour=18, minute=0, second=0, microsecond=0))
            db_session.add(other_block)
            db_session.commit()
            db_session.refresh(other_block)

            # Try to schedule with this unauthorized block
            with pytest.raises(HTTPException) as exc_info:
                await match_service.schedule_match(
                    sample_match.id, other_block.id, acting_participant_id=participant_user.id
                )

            assert exc_info.value.status_code == 400
            assert "not available for this match" in exc_info.value.detail.lower()

        except HTTPException:
            raise
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_schedule_match_prevents_double_booking_volunteer(
        self, db_session, participant_user, another_participant, volunteer_user
    ):
        """409 when trying to book a volunteer at a time they're already confirmed"""
        try:
            match_service = MatchService(db_session)

            # Create two matches with same volunteer, different participants
            now = datetime.now(timezone.utc)
            tomorrow = now + timedelta(days=1)
            same_time = tomorrow.replace(hour=14, minute=0, second=0, microsecond=0)

            # Match 1: Participant 1 + Volunteer
            match1 = Match(
                participant_id=participant_user.id,
                volunteer_id=volunteer_user.id,
                match_status_id=1,  # pending
            )
            db_session.add(match1)
            db_session.flush()

            block1 = TimeBlock(start_time=same_time)
            match1.suggested_time_blocks.append(block1)

            # Match 2: Participant 2 + Same Volunteer
            match2 = Match(
                participant_id=another_participant.id,
                volunteer_id=volunteer_user.id,
                match_status_id=1,  # pending
            )
            db_session.add(match2)
            db_session.flush()

            block2 = TimeBlock(start_time=same_time)  # Same time, different block instance!
            match2.suggested_time_blocks.append(block2)

            db_session.commit()
            db_session.refresh(match1)
            db_session.refresh(match2)

            # Participant 1 schedules first
            await match_service.schedule_match(match1.id, block1.id, acting_participant_id=participant_user.id)

            # Participant 2 tries to schedule same volunteer at same time
            with pytest.raises(HTTPException) as exc_info:
                await match_service.schedule_match(match2.id, block2.id, acting_participant_id=another_participant.id)

            assert exc_info.value.status_code == 409
            assert "already confirmed another appointment" in exc_info.value.detail.lower()

        except HTTPException:
            raise
        except Exception:
            db_session.rollback()
            raise


class TestVolunteerMatchFlow:
    """Test volunteer-specific match flows."""

    @pytest.mark.asyncio
    async def test_get_matches_for_volunteer_includes_awaiting(self, db_session, participant_user, volunteer_user):
        try:
            match_service = MatchService(db_session)
            request = MatchCreateRequest(
                participant_id=participant_user.id,
                volunteer_ids=[volunteer_user.id],
            )
            await match_service.create_matches(request)

            response = await match_service.get_matches_for_volunteer(volunteer_user.id)
            assert len(response.matches) == 1
            match_summary = response.matches[0]
            assert match_summary.match_status == "awaiting_volunteer_acceptance"
            assert match_summary.participant.id == participant_user.id

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_volunteer_accept_match_requires_ownership(
        self,
        db_session,
        participant_user,
        volunteer_with_availability,
        another_volunteer,
    ):
        try:
            match_service = MatchService(db_session)
            request = MatchCreateRequest(
                participant_id=participant_user.id,
                volunteer_ids=[volunteer_with_availability.id],
            )
            response = await match_service.create_matches(request)
            match_id = response.matches[0].id

            with pytest.raises(HTTPException) as exc_info:
                await match_service.volunteer_accept_match(match_id, another_volunteer.id)

            assert exc_info.value.status_code == 403

            detail = await match_service.volunteer_accept_match(match_id, volunteer_with_availability.id)
            assert detail.match_status == "pending"

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_volunteer_accept_match_requires_availability(self, db_session, participant_user, volunteer_user):
        """Volunteer cannot accept match without availability."""
        try:
            match_service = MatchService(db_session)
            request = MatchCreateRequest(
                participant_id=participant_user.id,
                volunteer_ids=[volunteer_user.id],
            )
            response = await match_service.create_matches(request)
            match_id = response.matches[0].id

            with pytest.raises(HTTPException) as exc_info:
                await match_service.volunteer_accept_match(match_id, volunteer_user.id)

            assert exc_info.value.status_code == 400
            assert "availability" in exc_info.value.detail.lower()

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise


# ========== REQUEST NEW TIMES TESTS ==========


class TestRequestNewTimes:
    """Test requesting new time windows."""

    @pytest.mark.asyncio
    async def test_request_new_times_success(self, db_session, sample_match, participant_user):
        """Participant can request new time windows"""
        try:
            match_service = MatchService(db_session)
            now = datetime.now(timezone.utc)
            tomorrow = now + timedelta(days=1)

            time_ranges = [
                TimeRange(
                    start_time=tomorrow.replace(hour=16, minute=0, second=0, microsecond=0),
                    end_time=tomorrow.replace(hour=17, minute=0, second=0, microsecond=0),
                )
            ]

            response = await match_service.request_new_times(
                sample_match.id, time_ranges, acting_participant_id=participant_user.id
            )

            assert response.id == sample_match.id
            assert response.match_status == "requesting_new_times"

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_request_new_times_clears_existing_suggestions(self, db_session, sample_match, participant_user):
        """Old suggested times are deleted"""
        try:
            match_service = MatchService(db_session)
            original_count = len(sample_match.suggested_time_blocks)
            assert original_count == 3

            now = datetime.now(timezone.utc)
            tomorrow = now + timedelta(days=1)

            time_ranges = [
                TimeRange(
                    start_time=tomorrow.replace(hour=16, minute=0, second=0, microsecond=0),
                    end_time=tomorrow.replace(hour=17, minute=0, second=0, microsecond=0),
                )
            ]

            await match_service.request_new_times(
                sample_match.id, time_ranges, acting_participant_id=participant_user.id
            )

            db_session.refresh(sample_match)
            # Should have 2 new blocks (16:00, 16:30)
            assert len(sample_match.suggested_time_blocks) == 2

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_request_new_times_generates_30_min_blocks(self, db_session, sample_match, participant_user):
        """Creates blocks every 30 minutes"""
        try:
            match_service = MatchService(db_session)
            now = datetime.now(timezone.utc)
            tomorrow = now + timedelta(days=1)

            # 2-hour window should generate 4 blocks
            time_ranges = [
                TimeRange(
                    start_time=tomorrow.replace(hour=10, minute=0, second=0, microsecond=0),
                    end_time=tomorrow.replace(hour=12, minute=0, second=0, microsecond=0),
                )
            ]

            await match_service.request_new_times(
                sample_match.id, time_ranges, acting_participant_id=participant_user.id
            )

            db_session.refresh(sample_match)
            assert len(sample_match.suggested_time_blocks) == 4

            # Verify times: 10:00, 10:30, 11:00, 11:30
            times = sorted([block.start_time for block in sample_match.suggested_time_blocks])
            assert times[0].hour == 10 and times[0].minute == 0
            assert times[1].hour == 10 and times[1].minute == 30
            assert times[2].hour == 11 and times[2].minute == 0
            assert times[3].hour == 11 and times[3].minute == 30

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_request_new_times_changes_status(self, db_session, sample_match, participant_user):
        """Status becomes 'requesting_new_times'"""
        try:
            match_service = MatchService(db_session)
            now = datetime.now(timezone.utc)
            tomorrow = now + timedelta(days=1)

            time_ranges = [
                TimeRange(
                    start_time=tomorrow.replace(hour=16, minute=0, second=0, microsecond=0),
                    end_time=tomorrow.replace(hour=17, minute=0, second=0, microsecond=0),
                )
            ]

            await match_service.request_new_times(
                sample_match.id, time_ranges, acting_participant_id=participant_user.id
            )

            db_session.refresh(sample_match)
            assert sample_match.match_status.name == "requesting_new_times"

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_request_new_times_rejects_after_scheduled(self, db_session, sample_match, participant_user):
        """400 when match already has chosen time"""
        try:
            match_service = MatchService(db_session)

            # First schedule the match
            time_block_id = sample_match.suggested_time_blocks[0].id
            await match_service.schedule_match(
                sample_match.id, time_block_id, acting_participant_id=participant_user.id
            )

            # Now try to request new times
            now = datetime.now(timezone.utc)
            tomorrow = now + timedelta(days=1)

            time_ranges = [
                TimeRange(
                    start_time=tomorrow.replace(hour=16, minute=0, second=0, microsecond=0),
                    end_time=tomorrow.replace(hour=17, minute=0, second=0, microsecond=0),
                )
            ]

            with pytest.raises(HTTPException) as exc_info:
                await match_service.request_new_times(
                    sample_match.id, time_ranges, acting_participant_id=participant_user.id
                )

            assert exc_info.value.status_code == 400
            assert "after a call is scheduled" in exc_info.value.detail.lower()

        except HTTPException:
            raise
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_request_new_times_multiple_ranges(self, db_session, sample_match, participant_user):
        """Can provide multiple time ranges"""
        try:
            match_service = MatchService(db_session)
            now = datetime.now(timezone.utc)
            tomorrow = now + timedelta(days=1)

            time_ranges = [
                TimeRange(
                    start_time=tomorrow.replace(hour=10, minute=0, second=0, microsecond=0),
                    end_time=tomorrow.replace(hour=11, minute=0, second=0, microsecond=0),
                ),
                TimeRange(
                    start_time=tomorrow.replace(hour=14, minute=0, second=0, microsecond=0),
                    end_time=tomorrow.replace(hour=15, minute=0, second=0, microsecond=0),
                ),
            ]

            await match_service.request_new_times(
                sample_match.id, time_ranges, acting_participant_id=participant_user.id
            )

            db_session.refresh(sample_match)
            # Should have 4 blocks total (2 from each range)
            assert len(sample_match.suggested_time_blocks) == 4

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise


# ========== CANCEL MATCH TESTS ==========


class TestCancelMatchByParticipant:
    """Test participant canceling their match."""

    @pytest.mark.asyncio
    async def test_cancel_match_by_participant_success(self, db_session, sample_match, participant_user):
        """Participant can cancel their match"""
        try:
            match_service = MatchService(db_session)

            response = await match_service.cancel_match_by_participant(
                sample_match.id, acting_participant_id=participant_user.id
            )

            assert response.id == sample_match.id
            assert response.match_status == "cancelled_by_participant"

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_cancel_match_changes_status(self, db_session, sample_match, participant_user):
        """Status becomes 'cancelled_by_participant'"""
        try:
            match_service = MatchService(db_session)

            await match_service.cancel_match_by_participant(sample_match.id, acting_participant_id=participant_user.id)

            db_session.refresh(sample_match)
            assert sample_match.match_status.name == "cancelled_by_participant"

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_cancel_match_clears_chosen_time(self, db_session, sample_match, participant_user):
        """Chosen time block is cleared if it exists"""
        try:
            match_service = MatchService(db_session)

            # First schedule the match
            time_block_id = sample_match.suggested_time_blocks[0].id
            await match_service.schedule_match(
                sample_match.id, time_block_id, acting_participant_id=participant_user.id
            )

            db_session.refresh(sample_match)
            assert sample_match.chosen_time_block_id is not None

            # Now cancel
            await match_service.cancel_match_by_participant(sample_match.id, acting_participant_id=participant_user.id)

            db_session.refresh(sample_match)
            assert sample_match.chosen_time_block_id is None
            assert sample_match.confirmed_time is None

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_cancel_match_ownership_check(self, db_session, sample_match, another_participant):
        """403 when different participant tries to cancel"""
        match_service = MatchService(db_session)

        with pytest.raises(HTTPException) as exc_info:
            await match_service.cancel_match_by_participant(
                sample_match.id, acting_participant_id=another_participant.id
            )

        assert exc_info.value.status_code == 403
        assert "Cannot modify another participant" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_cancel_match_admin_bypass(self, db_session, sample_match):
        """Admin can cancel on behalf (acting_participant_id=None)"""
        try:
            match_service = MatchService(db_session)

            response = await match_service.cancel_match_by_participant(sample_match.id, acting_participant_id=None)

            assert response.match_status == "cancelled_by_participant"

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise


class TestCancelMatchByVolunteer:
    """Test volunteer canceling a match."""

    @pytest.mark.asyncio
    async def test_cancel_match_by_volunteer_success(self, db_session, sample_match, volunteer_user):
        """Volunteer can cancel match"""
        try:
            match_service = MatchService(db_session)

            response = await match_service.cancel_match_by_volunteer(
                sample_match.id, acting_volunteer_id=volunteer_user.id
            )

            assert response.id == sample_match.id
            assert response.match_status == "cancelled_by_volunteer"

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_cancel_by_volunteer_changes_status(self, db_session, sample_match):
        """Status becomes 'cancelled_by_volunteer'"""
        try:
            match_service = MatchService(db_session)

            await match_service.cancel_match_by_volunteer(
                sample_match.id, acting_volunteer_id=sample_match.volunteer_id
            )

            db_session.refresh(sample_match)
            assert sample_match.match_status.name == "cancelled_by_volunteer"

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_cancel_by_volunteer_ownership_check(self, db_session, sample_match, another_volunteer):
        """403 when different volunteer tries to cancel"""
        match_service = MatchService(db_session)

        with pytest.raises(HTTPException) as exc_info:
            await match_service.cancel_match_by_volunteer(sample_match.id, acting_volunteer_id=another_volunteer.id)

        assert exc_info.value.status_code == 403
        assert "Cannot modify another volunteer" in exc_info.value.detail


# ========== REQUEST NEW VOLUNTEERS TESTS ==========


class TestRequestNewVolunteers:
    """Test requesting new volunteer suggestions."""

    @pytest.mark.asyncio
    async def test_request_new_volunteers_deletes_matches(
        self, db_session, participant_user, volunteer_user, another_volunteer
    ):
        """All participant matches are deleted"""
        try:
            match_service = MatchService(db_session)

            # Create 2 matches
            request = MatchCreateRequest(
                participant_id=participant_user.id,
                volunteer_ids=[volunteer_user.id, another_volunteer.id],
            )
            await match_service.create_matches(request)

            # Verify 2 matches exist
            matches = db_session.query(Match).filter(Match.participant_id == participant_user.id).all()
            assert len(matches) == 2

            # Request new volunteers
            await match_service.request_new_volunteers(participant_user.id, acting_participant_id=participant_user.id)

            # Verify all active matches removed, but records remain soft-deleted
            active_matches = (
                db_session.query(Match)
                .filter(Match.participant_id == participant_user.id, Match.deleted_at.is_(None))
                .all()
            )
            assert len(active_matches) == 0

            soft_deleted = (
                db_session.query(Match)
                .filter(Match.participant_id == participant_user.id, Match.deleted_at.isnot(None))
                .all()
            )
            assert len(soft_deleted) == 2

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_request_new_volunteers_returns_count(
        self, db_session, participant_user, volunteer_user, another_volunteer
    ):
        """Response includes number of deleted matches"""
        try:
            match_service = MatchService(db_session)

            # Create 2 matches
            request = MatchCreateRequest(
                participant_id=participant_user.id,
                volunteer_ids=[volunteer_user.id, another_volunteer.id],
            )
            await match_service.create_matches(request)

            # Request new volunteers
            response = await match_service.request_new_volunteers(
                participant_user.id, acting_participant_id=participant_user.id
            )

            assert isinstance(response, MatchRequestNewVolunteersResponse)
            assert response.deleted_matches == 2

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_request_new_volunteers_preserves_completed_matches(
        self, db_session, participant_user, volunteer_user
    ):
        """Matches with final statuses should remain after requesting new volunteers"""
        try:
            match_service = MatchService(db_session)

            # Active match to be deleted
            await match_service.create_matches(
                MatchCreateRequest(participant_id=participant_user.id, volunteer_ids=[volunteer_user.id])
            )

            # Historical completed match
            completed_status = db_session.query(MatchStatus).filter_by(name="completed").one()
            historical = Match(
                participant_id=participant_user.id,
                volunteer_id=volunteer_user.id,
                match_status=completed_status,
            )
            db_session.add(historical)
            db_session.commit()

            await match_service.request_new_volunteers(participant_user.id, acting_participant_id=participant_user.id)

            db_session.refresh(historical)
            assert historical.deleted_at is None
            assert historical.match_status.name == "completed"

            active_matches = (
                db_session.query(Match)
                .filter(Match.participant_id == participant_user.id, Match.deleted_at.is_(None))
                .all()
            )
            assert all(m.match_status.name == "completed" for m in active_matches)

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_request_new_volunteers_ownership_check(self, db_session, participant_user, another_participant):
        """403 when different participant tries"""
        match_service = MatchService(db_session)

        with pytest.raises(HTTPException) as exc_info:
            await match_service.request_new_volunteers(
                participant_user.id, acting_participant_id=another_participant.id
            )

        assert exc_info.value.status_code == 403
        assert "Cannot modify another participant" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_request_new_volunteers_admin_on_behalf(self, db_session, participant_user, volunteer_user):
        """Admin can request for specific participant (acting_participant_id=None)"""
        try:
            match_service = MatchService(db_session)

            # Create a match
            request = MatchCreateRequest(
                participant_id=participant_user.id,
                volunteer_ids=[volunteer_user.id],
            )
            await match_service.create_matches(request)

            # Admin requests new volunteers (bypasses ownership check)
            response = await match_service.request_new_volunteers(participant_user.id, acting_participant_id=None)

            assert response.deleted_matches == 1

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise


# ========== UPDATE MATCH TESTS ==========


class TestUpdateMatch:
    """Test admin updating match properties."""

    @pytest.mark.asyncio
    async def test_update_match_volunteer(self, db_session, sample_match, another_volunteer):
        """Admin can change match volunteer"""
        try:
            match_service = MatchService(db_session)

            update_request = MatchUpdateRequest(volunteer_id=another_volunteer.id)

            response = await match_service.update_match(sample_match.id, update_request)

            assert response.volunteer_id == another_volunteer.id

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_update_match_status(self, db_session, sample_match):
        """Admin can change match status"""
        try:
            match_service = MatchService(db_session)

            update_request = MatchUpdateRequest(match_status="completed")

            response = await match_service.update_match(sample_match.id, update_request)

            assert response.match_status == "completed"

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_update_match_set_chosen_time(self, db_session, sample_match):
        """Admin can set chosen time"""
        try:
            match_service = MatchService(db_session)
            time_block_id = sample_match.suggested_time_blocks[0].id

            update_request = MatchUpdateRequest(chosen_time_block_id=time_block_id)

            response = await match_service.update_match(sample_match.id, update_request)

            assert response.chosen_time_block_id == time_block_id

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_update_match_clear_chosen_time(self, db_session, sample_match, participant_user):
        """Admin can clear chosen time"""
        try:
            match_service = MatchService(db_session)

            # First set a chosen time
            time_block_id = sample_match.suggested_time_blocks[0].id
            await match_service.schedule_match(
                sample_match.id, time_block_id, acting_participant_id=participant_user.id
            )

            db_session.refresh(sample_match)
            assert sample_match.chosen_time_block_id is not None

            # Now clear it
            update_request = MatchUpdateRequest(clear_chosen_time=True)
            response = await match_service.update_match(sample_match.id, update_request)

            assert response.chosen_time_block_id is None

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise

    @pytest.mark.asyncio
    async def test_update_match_invalid_match_404(self, db_session):
        """404 when match doesn't exist"""
        match_service = MatchService(db_session)

        update_request = MatchUpdateRequest(match_status="completed")

        with pytest.raises(HTTPException) as exc_info:
            await match_service.update_match(99999, update_request)

        assert exc_info.value.status_code == 404
        assert "Match" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_update_match_reassigns_volunteer_resets_suggested_times(
        self,
        db_session,
        participant_user,
        volunteer_with_availability,
        volunteer_with_alt_availability,
    ):
        """Changing the volunteer regenerates suggested times and clears chosen slot"""
        try:
            match_service = MatchService(db_session)

            # Create match with first volunteer and schedule it
            create_request = MatchCreateRequest(
                participant_id=participant_user.id,
                volunteer_ids=[volunteer_with_availability.id],
            )
            response = await match_service.create_matches(create_request)
            match_id = response.matches[0].id

            match = db_session.get(Match, match_id)
            await match_service.volunteer_accept_match(match_id, volunteer_with_availability.id)
            db_session.refresh(match)
            assert len(match.suggested_time_blocks) > 0

            time_block_id = match.suggested_time_blocks[0].id
            await match_service.schedule_match(match_id, time_block_id, acting_participant_id=participant_user.id)

            db_session.refresh(match)
            assert match.match_status.name == "confirmed"
            assert match.chosen_time_block_id is not None

            # Reassign to alternate volunteer
            update_request = MatchUpdateRequest(volunteer_id=volunteer_with_alt_availability.id)
            await match_service.update_match(match_id, update_request)

            db_session.refresh(match)
            assert match.volunteer_id == volunteer_with_alt_availability.id
            assert match.chosen_time_block_id is None
            assert match.match_status.name == "awaiting_volunteer_acceptance"
            assert len(match.suggested_time_blocks) == 0

            await match_service.volunteer_accept_match(match_id, volunteer_with_alt_availability.id)
            db_session.refresh(match)
            assert match.match_status.name == "pending"

            # Verify suggested times were generated from templates
            # Templates project to next week, so we should have some suggested times
            assert len(match.suggested_time_blocks) > 0
            # Verify all times are in UTC and on half-hour boundaries
            for block in match.suggested_time_blocks:
                assert block.start_time.tzinfo == timezone.utc
                assert block.start_time.minute in {0, 30}

            db_session.commit()
        except Exception:
            db_session.rollback()
            raise
