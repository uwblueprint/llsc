"""Test script for match auto-completion service."""

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy.orm import Session, joinedload

# Add the backend directory to the path so we can import app modules
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.models.Match import Match  # noqa: E402
from app.models.MatchStatus import MatchStatus  # noqa: E402
from app.models.TimeBlock import TimeBlock  # noqa: E402
from app.models.User import User  # noqa: E402
from app.services.implementations.match_completion_service import MatchCompletionService  # noqa: E402
from app.utilities.db_utils import SessionLocal  # noqa: E402

load_dotenv()


def create_test_match_with_past_call():
    """Create a test match with a confirmed call time that ended 30+ minutes ago."""
    session: Session = SessionLocal()

    try:
        print("Creating test match with past call time...")

        # Find a participant and volunteer
        participant = session.query(User).filter(User.email == "yashkoth7@gmail.com").first()
        if not participant:
            print("❌ Test participant not found")
            return

        volunteer = session.query(User).filter(User.email == "david.thompson@example.com").first()
        if not volunteer:
            print("❌ Test volunteer not found")
            return

        # Get confirmed status
        confirmed_status = session.query(MatchStatus).filter(MatchStatus.name == "confirmed").first()
        if not confirmed_status:
            print("❌ Confirmed status not found")
            return

        # Create a time block 60 minutes in the past (so call ended 30 minutes ago)
        past_time = datetime.now(timezone.utc) - timedelta(minutes=60)
        time_block = TimeBlock(start_time=past_time)
        session.add(time_block)
        session.flush()

        # Create or update a match
        existing_match = (
            session.query(Match)
            .filter(
                Match.participant_id == participant.id, Match.volunteer_id == volunteer.id, Match.deleted_at.is_(None)
            )
            .first()
        )

        if existing_match:
            existing_match.match_status_id = confirmed_status.id
            existing_match.chosen_time_block_id = time_block.id
            existing_match.deleted_at = None  # Ensure it's not soft-deleted
            match = existing_match
            print(f"✅ Updated existing match {match.id}")
        else:
            match = Match(
                participant_id=participant.id,
                volunteer_id=volunteer.id,
                match_status_id=confirmed_status.id,
                chosen_time_block_id=time_block.id,
            )
            session.add(match)
            session.flush()
            print(f"✅ Created new match {match.id}")

        session.commit()

        print(f"Match ID: {match.id}")
        print("Status: confirmed")
        print(f"Call time: {past_time}")
        print(f"Minutes since call: {(datetime.now(timezone.utc) - past_time).total_seconds() / 60:.1f}")

        return match.id

    except Exception as e:
        session.rollback()
        print(f"❌ Error creating test match: {str(e)}")
        import traceback

        traceback.print_exc()
    finally:
        session.close()


def verify_match_completion(match_id: int):
    """Verify that a match was completed correctly."""
    session: Session = SessionLocal()

    try:
        match = (
            session.query(Match)
            .options(joinedload(Match.match_status), joinedload(Match.confirmed_time))
            .filter(Match.id == match_id)
            .first()
        )

        if not match:
            print(f"❌ Match {match_id} not found")
            return False

        print(f"\n📋 Match {match_id} Status:")
        print(f"  Status: {match.match_status.name if match.match_status else 'Unknown'}")
        print(f"  Deleted at: {match.deleted_at}")
        print(f"  Call time: {match.confirmed_time.start_time if match.confirmed_time else 'N/A'}")

        is_completed = match.match_status and match.match_status.name == "completed"
        is_soft_deleted = match.deleted_at is not None

        if is_completed and is_soft_deleted:
            print("✅ Match was successfully auto-completed and soft-deleted!")
            return True
        else:
            print(f"❌ Match not properly completed (completed: {is_completed}, soft-deleted: {is_soft_deleted})")
            return False

    except Exception as e:
        print(f"❌ Error verifying match: {str(e)}")
        import traceback

        traceback.print_exc()
        return False
    finally:
        session.close()


def main():
    print("=" * 60)
    print("Match Auto-Completion Test Script")
    print("=" * 60)

    # Step 1: Create test match
    match_id = create_test_match_with_past_call()
    if not match_id:
        print("\n❌ Failed to create test match")
        return

    # Step 2: Run auto-completion service
    print("\n" + "=" * 60)
    print("Running Match Completion Service...")
    print("=" * 60)

    service = MatchCompletionService()
    service.auto_complete_matches()

    # Step 3: Verify the match was completed
    print("\n" + "=" * 60)
    print("Verifying Results...")
    print("=" * 60)

    success = verify_match_completion(match_id)

    print("\n" + "=" * 60)
    if success:
        print("✅ TEST PASSED: Match auto-completion working correctly!")
    else:
        print("❌ TEST FAILED: Check the output above for details")
    print("=" * 60)


if __name__ == "__main__":
    main()
