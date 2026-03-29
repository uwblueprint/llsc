"""
Seed matches in EVERY status so you can visually test all mobile screens.

Usage:
    cd backend
    python seed_all_match_states.py

Prerequisites:
    - Postgres running (docker-compose up -d)
    - Migrations applied (pdm run upgrade)
    - Base seeds run (pdm run seed)

This creates matches for the Test Participant (testparticipant@gmail.com)
with various seeded volunteers, one match per status:

  1. pending                       -> Volunteer dashboard: "Schedule Call" card
  2. confirmed                     -> Scheduled calls list, call details, cancel flow
  3. cancelled_by_participant      -> Volunteer: CallCancelledNotificationModal
  4. cancelled_by_volunteer        -> Participant: notification
  5. requesting_new_times          -> Volunteer: time-request page, TimeRequestNotificationModal
  6. awaiting_volunteer_acceptance  -> Volunteer: accept/decline flow
  7. completed (soft-deleted)       -> Match history (if implemented)

It also creates matches for a seeded participant (sarah.johnson@example.com)
so you can test the PARTICIPANT dashboard with different volunteer states.
"""

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy.orm import Session, joinedload

# Add the backend directory to the path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.models.Match import Match  # noqa: E402
from app.models.TimeBlock import TimeBlock  # noqa: E402
from app.models.User import User  # noqa: E402
from app.utilities.db_utils import SessionLocal  # noqa: E402

load_dotenv()

# Match status name -> ID (from seeds)
STATUS_MAP = {
    "pending": 1,
    "confirmed": 2,
    "cancelled_by_participant": 3,
    "completed": 4,
    "no_show": 5,
    "rescheduled": 6,
    "cancelled_by_volunteer": 7,
    "requesting_new_times": 8,
    "requesting_new_volunteers": 9,
    "awaiting_volunteer_acceptance": 10,
}

# Seeded volunteer emails (from seeds/users.py)
VOLUNTEER_EMAILS = [
    "david.thompson@example.com",
    "jennifer.kim@example.com",
    "robert.williams@example.com",
    "emily.chen@example.com",
    "amanda.taylor@example.com",
    "james.wilson@example.com",
    "maria.garcia@example.com",
]

# Seeded participant emails
PARTICIPANT_EMAILS = [
    "sarah.johnson@example.com",
    "michael.chen@example.com",
    "lisa.rodriguez@example.com",
]


def clear_existing_matches(session: Session) -> None:
    """Remove all existing matches and orphan time blocks for a clean slate."""
    session.query(Match).delete()
    session.query(TimeBlock).delete()
    session.commit()
    print("  Cleared all existing matches and time blocks")


def create_future_time_blocks(session: Session, count: int = 6) -> list[TimeBlock]:
    """Create time blocks spread across the next few days."""
    blocks = []
    now = datetime.now(timezone.utc)
    # Start from tomorrow at 10 AM UTC
    base = now.replace(hour=10, minute=0, second=0, microsecond=0) + timedelta(days=1)

    for i in range(count):
        # Spread across 3 days, 2 blocks per day (10:00, 14:00)
        day_offset = i // 2
        hour_offset = (i % 2) * 4  # 10:00 or 14:00
        start_time = base + timedelta(days=day_offset, hours=hour_offset)
        block = TimeBlock(start_time=start_time)
        session.add(block)
        blocks.append(block)

    session.flush()
    return blocks


def create_past_time_block(session: Session) -> TimeBlock:
    """Create a time block 2 hours in the past (for confirmed/completed matches)."""
    past_time = datetime.now(timezone.utc) - timedelta(hours=2)
    block = TimeBlock(start_time=past_time)
    session.add(block)
    session.flush()
    return block


def create_future_time_block(session: Session) -> TimeBlock:
    """Create a single time block tomorrow at 1 PM UTC (for confirmed matches)."""
    tomorrow = datetime.now(timezone.utc).replace(hour=13, minute=0, second=0, microsecond=0) + timedelta(days=1)
    block = TimeBlock(start_time=tomorrow)
    session.add(block)
    session.flush()
    return block


def get_user_by_email(session: Session, email: str) -> User | None:
    return session.query(User).options(joinedload(User.user_data)).filter(User.email == email).first()


def create_match(
    session: Session,
    participant: User,
    volunteer: User,
    status_name: str,
    chosen_time_block: TimeBlock | None = None,
    suggested_time_blocks: list[TimeBlock] | None = None,
    soft_deleted: bool = False,
) -> Match:
    """Create a match with the given status and optional time blocks."""
    match = Match(
        participant_id=participant.id,
        volunteer_id=volunteer.id,
        match_status_id=STATUS_MAP[status_name],
        chosen_time_block_id=chosen_time_block.id if chosen_time_block else None,
        deleted_at=datetime.now(timezone.utc) if soft_deleted else None,
    )
    session.add(match)
    session.flush()

    if suggested_time_blocks:
        for block in suggested_time_blocks:
            match.suggested_time_blocks.append(block)

    session.flush()
    return match


def seed_volunteer_perspective(session: Session) -> None:
    """
    Create matches visible from the VOLUNTEER dashboard.
    Uses sarah.johnson as the participant, paired with various volunteers.
    The volunteer you log in as will see these on their dashboard.
    """
    print("\n=== Seeding VOLUNTEER perspective matches ===")
    print("(Log in as a volunteer to see these)\n")

    participant = get_user_by_email(session, "sarah.johnson@example.com")
    if not participant:
        print("  Participant sarah.johnson@example.com not found, skipping")
        return

    volunteers = []
    for email in VOLUNTEER_EMAILS:
        v = get_user_by_email(session, email)
        if v:
            volunteers.append(v)

    if len(volunteers) < 7:
        print(f"  Only found {len(volunteers)}/7 volunteers, some states will be skipped")

    idx = 0

    # 1. PENDING - volunteer sees "Schedule Call" button
    if idx < len(volunteers):
        suggested = create_future_time_blocks(session, 6)
        m = create_match(session, participant, volunteers[idx], "pending", suggested_time_blocks=suggested)
        print(f"  [pending]                        Match #{m.id} — {volunteers[idx].email}")
        print("    -> Volunteer dashboard: participant card with 'Schedule Call' button")
        idx += 1

    # 2. PENDING (second match, to show multiple cards)
    if idx < len(volunteers):
        suggested = create_future_time_blocks(session, 4)
        m = create_match(session, participant, volunteers[idx], "pending", suggested_time_blocks=suggested)
        print(f"  [pending]                        Match #{m.id} — {volunteers[idx].email}")
        print("    -> Second pending match for testing multiple cards on dashboard")
        idx += 1

    # 3. CONFIRMED - volunteer sees scheduled call details
    if idx < len(volunteers):
        chosen = create_future_time_block(session)
        m = create_match(session, participant, volunteers[idx], "confirmed", chosen_time_block=chosen)
        print(f"  [confirmed]                      Match #{m.id} — {volunteers[idx].email}")
        print("    -> Scheduled calls page: call details, cancel flow, view contact")
        idx += 1

    # 4. REQUESTING_NEW_TIMES - participant requested new times
    if idx < len(volunteers):
        suggested = create_future_time_blocks(session, 6)
        m = create_match(session, participant, volunteers[idx], "requesting_new_times", suggested_time_blocks=suggested)
        print(f"  [requesting_new_times]           Match #{m.id} — {volunteers[idx].email}")
        print("    -> TimeRequestNotificationModal on dashboard load")
        print("    -> time-request/[matchId] page: date/time selection, confirm/decline")
        idx += 1

    # 5. CANCELLED_BY_PARTICIPANT - triggers notification modal
    if idx < len(volunteers):
        m = create_match(session, participant, volunteers[idx], "cancelled_by_participant")
        print(f"  [cancelled_by_participant]       Match #{m.id} — {volunteers[idx].email}")
        print("    -> CallCancelledNotificationModal on dashboard load")
        idx += 1

    # 6. AWAITING_VOLUNTEER_ACCEPTANCE
    if idx < len(volunteers):
        m = create_match(session, participant, volunteers[idx], "awaiting_volunteer_acceptance")
        print(f"  [awaiting_volunteer_acceptance]   Match #{m.id} — {volunteers[idx].email}")
        print("    -> Shows on dashboard if volunteer accept flow is implemented")
        idx += 1

    # 7. COMPLETED (soft-deleted, visible in match history)
    if idx < len(volunteers):
        past = create_past_time_block(session)
        m = create_match(session, participant, volunteers[idx], "completed", chosen_time_block=past, soft_deleted=True)
        print(f"  [completed]                      Match #{m.id} — {volunteers[idx].email} (soft-deleted)")
        print("    -> Match history page (if implemented)")
        idx += 1


def seed_participant_perspective(session: Session) -> None:
    """
    Create matches visible from the PARTICIPANT dashboard.
    Uses sarah.johnson as the participant, with the same volunteers.
    This way you can log in as sarah.johnson and see matches from the participant POV.
    """
    print("\n=== Seeding PARTICIPANT perspective matches ===")
    print("(Log in as sarah.johnson@example.com to see these)\n")
    print("  NOTE: The volunteer-perspective matches above already create matches")
    print("  for sarah.johnson. When she logs in as participant, she will see:")
    print("    - pending matches       -> VolunteerCards with 'Schedule Call' button")
    print("    - confirmed matches     -> ConfirmedMatchCard with call details")
    print("    - requesting_new_times  -> Waiting state on dashboard")
    print("    - cancelled matches     -> Notification modals")
    print()
    print("  Additional participant-specific flows to test:")
    print("    - Schedule call: click 'Schedule Call' on a pending match")
    print("    - Request new times: from the scheduling page")
    print("    - Request new matches: '+ Request New Matches' button")
    print("    - Cancel call: from scheduled calls / confirmed match")
    print("    - Edit profile: via hamburger menu")
    print("    - Contact form: via hamburger menu")
    print("    - Opt out: from account settings")


def print_test_checklist() -> None:
    """Print a manual testing checklist."""
    print("\n" + "=" * 70)
    print("MOBILE TESTING CHECKLIST")
    print("=" * 70)
    print("""
Open http://localhost:3000 in Chrome, press F12 -> Cmd+Shift+M -> iPhone 14

VOLUNTEER FLOWS (log in as a seeded volunteer):
  [ ] Dashboard: multiple participant cards visible, no horizontal overflow
  [ ] Dashboard: hamburger menu opens drawer with nav items
  [ ] Dashboard empty state: "No new matches yet" (use a volunteer with no matches)
  [ ] Dashboard: "requesting_new_times" shows TimeRequestNotificationModal on load
  [ ] Dashboard: "cancelled_by_participant" shows CallCancelledNotificationModal
  [ ] Scheduled Calls: list of confirmed calls, tap to see details
  [ ] Scheduled Calls -> Call Details: participant info, cancel button
  [ ] Scheduled Calls -> Cancel: confirmation modal -> success modal
  [ ] Time Request page: date boxes full-width, time chips wrap, stacked buttons
  [ ] Time Request -> Confirm: confirmation modal -> success modal
  [ ] Time Request -> Decline All: confirmation
  [ ] Schedule availability (first-time): day pills + vertical time list
  [ ] Edit Profile -> Personal Details tab: form fields full-width
  [ ] Edit Profile -> History tab: diagnosis/treatments/experiences cards
  [ ] Edit Profile -> Availability tab: day pills + time slots
  [ ] FAQs page: text wraps, no overflow
  [ ] Match History page: text wraps, no overflow
  [ ] Contact form: fields full-width, Cancel/Send buttons
  [ ] Become Participant form: multi-step form, full-width fields

PARTICIPANT FLOWS (log in as sarah.johnson@example.com):
  [ ] Dashboard: VolunteerCards for pending matches (mobile cards, not table)
  [ ] Dashboard: ConfirmedMatchCard for confirmed matches
  [ ] Dashboard: hamburger menu with nav items
  [ ] Schedule Call: date selection -> time selection -> confirm -> success
  [ ] Request New Times: calendar -> time scheduler (horizontal scroll)
  [ ] Request New Matches: notes textarea -> submit -> success -> pending state
  [ ] Scheduled Calls: call list -> call details -> cancel flow
  [ ] Edit Profile -> Personal Details tab
  [ ] Edit Profile -> History tab (diagnosis/treatments/experiences)
  [ ] Contact form
  [ ] Opt Out form: feedback textarea -> Cancel/Opt Out buttons -> success
  [ ] Become Volunteer form: multi-step intake

BREAKPOINT TESTING:
  [ ] Resize from 320px to 768px — no content jumps or overflow at any width
  [ ] Test at 375px (iPhone SE), 393px (iPhone 14), 430px (iPhone 14 Pro Max)
""")


def main():
    session: Session = SessionLocal()

    try:
        print("=" * 70)
        print("LLSC Mobile Testing — Match State Seeder")
        print("=" * 70)

        clear_existing_matches(session)
        seed_volunteer_perspective(session)
        seed_participant_perspective(session)

        session.commit()
        print("\n  All matches seeded successfully!")

        print_test_checklist()

    except Exception as e:
        session.rollback()
        print(f"\n  Error: {e}")
        import traceback

        traceback.print_exc()
    finally:
        session.close()


if __name__ == "__main__":
    main()
