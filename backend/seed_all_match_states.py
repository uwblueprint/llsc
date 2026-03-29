"""
Seed matches in EVERY status so you can visually test all mobile screens.

Usage:
    cd backend
    pdm run seed-matches

Prerequisites:
    - Postgres running (docker compose up -d)
    - Migrations applied (pdm run upgrade)
    - Base seeds run (pdm run seed)
    - serviceAccountKey.json in backend/ (for Firebase UID lookup)
    - Firebase accounts created for the test emails below

Test accounts:
    Participant: yashtestparticipant@gmail.com
    Volunteer:   yashtestvolunteer@gmail.com

What this creates:
  PARTICIPANT perspective (log in as yashtestparticipant@gmail.com):
    - 2x pending matches          -> VolunteerCards with "Schedule Call"
    - 1x confirmed match          -> ConfirmedMatchCard, cancel flow
    - 1x requesting_new_times     -> Waiting badge on card
    - 1x cancelled_by_volunteer   -> Notification modal on load

  VOLUNTEER perspective (log in as yashtestvolunteer@gmail.com):
    - 2x pending matches          -> ProfileCards with "Schedule Call"
    - 1x confirmed match          -> Scheduled calls, view contact, cancel flow
    - 1x requesting_new_times     -> TimeRequestNotificationModal, time-request page
    - 1x cancelled_by_participant -> CallCancelledNotificationModal
"""

import sys
import uuid
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path

import firebase_admin
from dotenv import load_dotenv
from firebase_admin import auth, credentials
from sqlalchemy.orm import Session, joinedload

# Add the backend directory to the path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.models.AvailabilityTemplate import AvailabilityTemplate  # noqa: E402
from app.models.Match import Match  # noqa: E402
from app.models.Role import Role  # noqa: E402
from app.models.TimeBlock import TimeBlock  # noqa: E402
from app.models.User import FormStatus, Language, User  # noqa: E402
from app.models.UserData import UserData  # noqa: E402
from app.models.VolunteerData import VolunteerData  # noqa: E402
from app.utilities.db_utils import SessionLocal  # noqa: E402

load_dotenv()

# ─── Config ───────────────────────────────────────────────────────────
TEST_PARTICIPANT_EMAIL = "yashtestparticipant@gmail.com"
TEST_VOLUNTEER_EMAIL = "yashtestvolunteer@gmail.com"

# Match status IDs (from seeds/match_status.py)
STATUS = {
    "pending": 1,
    "confirmed": 2,
    "cancelled_by_participant": 3,
    "completed": 4,
    "cancelled_by_volunteer": 7,
    "requesting_new_times": 8,
    "awaiting_volunteer_acceptance": 10,
}

# Seeded volunteer emails to pair with our test participant
SEED_VOLUNTEER_EMAILS = [
    "david.thompson@example.com",
    "jennifer.kim@example.com",
    "robert.williams@example.com",
    "emily.chen@example.com",
    "amanda.taylor@example.com",
]

# Seeded participant emails to pair with our test volunteer
SEED_PARTICIPANT_EMAILS = [
    "sarah.johnson@example.com",
    "michael.chen@example.com",
    "lisa.rodriguez@example.com",
    "karen.davis@example.com",
]


# ─── Firebase helpers ─────────────────────────────────────────────────
def init_firebase():
    """Initialize Firebase Admin SDK."""
    if not firebase_admin._apps:
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred)


def get_firebase_uid(email: str) -> str | None:
    """Look up a Firebase user's UID by email."""
    try:
        user = auth.get_user_by_email(email)
        return user.uid
    except auth.UserNotFoundError:
        return None


def verify_firebase_email(email: str) -> bool:
    """Mark a Firebase user's email as verified."""
    try:
        user = auth.get_user_by_email(email)
        auth.update_user(user.uid, email_verified=True)
        return True
    except Exception as e:
        print(f"    Warning: could not verify {email}: {e}")
        return False


# ─── DB helpers ───────────────────────────────────────────────────────
def get_user_by_email(session: Session, email: str) -> User | None:
    return session.query(User).options(joinedload(User.user_data)).filter(User.email == email).first()


def ensure_test_participant(session: Session, email: str, firebase_uid: str) -> User:
    """Create or update the test participant DB user with the real Firebase UID."""
    user = get_user_by_email(session, email)
    participant_role = session.query(Role).filter(Role.name == "participant").first()

    if user:
        # Update auth_id to real Firebase UID
        user.auth_id = firebase_uid
        user.approved = True
        user.active = True
        user.form_status = FormStatus.COMPLETED
        session.add(user)
        session.flush()
        print(f"  Updated existing participant: {email} (auth_id -> {firebase_uid})")
        return user

    # Create new user
    user = User(
        id=uuid.uuid4(),
        first_name="Yash",
        last_name="Participant",
        email=email,
        role_id=participant_role.id,
        auth_id=firebase_uid,
        approved=True,
        active=True,
        form_status=FormStatus.COMPLETED,
        language=Language.EN,
    )
    session.add(user)
    session.flush()

    # Create user_data
    user_data = UserData(
        user_id=user.id,
        date_of_birth=date(1995, 6, 15),
        phone="555-9901",
        city="Toronto",
        province="Ontario",
        postal_code="M5V 1A1",
        gender_identity="Man",
        pronouns=["he", "him"],
        ethnic_group=["South Asian"],
        marital_status="Single",
        has_kids="No",
        diagnosis="Acute Lymphoblastic Leukemia",
        date_of_diagnosis=date(2024, 3, 1),
        has_blood_cancer="yes",
        caring_for_someone="no",
        timezone="EST",
    )
    session.add(user_data)
    session.flush()
    print(f"  Created test participant: {email} (auth_id: {firebase_uid})")
    return user


def ensure_test_volunteer(session: Session, email: str, firebase_uid: str) -> User:
    """Create or update the test volunteer DB user with the real Firebase UID."""
    user = get_user_by_email(session, email)
    volunteer_role = session.query(Role).filter(Role.name == "volunteer").first()

    if user:
        user.auth_id = firebase_uid
        user.approved = True
        user.active = True
        user.form_status = FormStatus.COMPLETED
        session.add(user)
        session.flush()
        print(f"  Updated existing volunteer: {email} (auth_id -> {firebase_uid})")
        return user

    # Create new user
    user = User(
        id=uuid.uuid4(),
        first_name="Yash",
        last_name="Volunteer",
        email=email,
        role_id=volunteer_role.id,
        auth_id=firebase_uid,
        approved=True,
        active=True,
        form_status=FormStatus.COMPLETED,
        language=Language.EN,
    )
    session.add(user)
    session.flush()

    # Create user_data
    user_data = UserData(
        user_id=user.id,
        date_of_birth=date(1993, 2, 10),
        phone="555-9902",
        city="Toronto",
        province="Ontario",
        postal_code="M5V 2B4",
        gender_identity="Man",
        pronouns=["he", "him"],
        ethnic_group=["South Asian"],
        marital_status="Single",
        has_kids="No",
        diagnosis="Hodgkin Lymphoma",
        date_of_diagnosis=date(2020, 8, 15),
        has_blood_cancer="yes",
        caring_for_someone="no",
        timezone="EST",
    )
    session.add(user_data)
    session.flush()

    # Create volunteer_data
    volunteer_data = VolunteerData(
        user_id=user.id,
        volunteer_experience="Survived Hodgkin Lymphoma and want to help others going through treatment.",
    )
    session.add(volunteer_data)

    # Create availability templates
    templates = [
        {"day_of_week": 0, "start_time": time(10, 0), "end_time": time(12, 0)},  # Mon 10-12
        {"day_of_week": 2, "start_time": time(14, 0), "end_time": time(16, 0)},  # Wed 2-4pm
        {"day_of_week": 4, "start_time": time(9, 0), "end_time": time(11, 0)},  # Fri 9-11am
    ]
    for t in templates:
        avail = AvailabilityTemplate(
            user_id=user.id,
            day_of_week=t["day_of_week"],
            start_time=t["start_time"],
            end_time=t["end_time"],
            is_active=True,
        )
        session.add(avail)

    session.flush()
    print(f"  Created test volunteer: {email} (auth_id: {firebase_uid})")
    return user


# ─── Time block helpers ───────────────────────────────────────────────
def create_future_time_blocks(session: Session, count: int = 6) -> list[TimeBlock]:
    """Create time blocks spread across the next few days."""
    blocks = []
    now = datetime.now(timezone.utc)
    base = now.replace(hour=10, minute=0, second=0, microsecond=0) + timedelta(days=1)

    for i in range(count):
        day_offset = i // 2
        hour_offset = (i % 2) * 4
        start_time = base + timedelta(days=day_offset, hours=hour_offset)
        block = TimeBlock(start_time=start_time)
        session.add(block)
        blocks.append(block)

    session.flush()
    return blocks


def create_future_time_block(session: Session) -> TimeBlock:
    """Create a single time block tomorrow at 1 PM UTC."""
    tomorrow = datetime.now(timezone.utc).replace(hour=13, minute=0, second=0, microsecond=0) + timedelta(days=1)
    block = TimeBlock(start_time=tomorrow)
    session.add(block)
    session.flush()
    return block


# ─── Match creation ──────────────────────────────────────────────────
def create_match(
    session: Session,
    participant: User,
    volunteer: User,
    status_name: str,
    chosen_time_block: TimeBlock | None = None,
    suggested_time_blocks: list[TimeBlock] | None = None,
    soft_deleted: bool = False,
) -> Match:
    match = Match(
        participant_id=participant.id,
        volunteer_id=volunteer.id,
        match_status_id=STATUS[status_name],
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


def clear_existing_matches(session: Session) -> None:
    session.query(Match).delete()
    session.query(TimeBlock).delete()
    session.commit()
    print("  Cleared all existing matches and time blocks")


# ─── Seed functions ──────────────────────────────────────────────────
def seed_participant_perspective(session: Session, test_participant: User) -> None:
    """
    Matches visible when logged in as the TEST PARTICIPANT.
    Paired with seeded volunteers so the participant sees various match states.
    """
    print("\n=== PARTICIPANT perspective ===")
    print(f"(Log in as {TEST_PARTICIPANT_EMAIL})\n")

    volunteers = []
    for email in SEED_VOLUNTEER_EMAILS:
        v = get_user_by_email(session, email)
        if v:
            volunteers.append(v)

    if len(volunteers) < 5:
        print(f"  Warning: only found {len(volunteers)}/5 seeded volunteers")

    idx = 0

    # 1. PENDING — VolunteerCard with "Schedule Call"
    if idx < len(volunteers):
        suggested = create_future_time_blocks(session, 6)
        m = create_match(
            session,
            test_participant,
            volunteers[idx],
            "pending",
            suggested_time_blocks=suggested,
        )
        print(
            f"  [pending]                  Match #{m.id} with {volunteers[idx].first_name} {volunteers[idx].last_name}"
        )
        print("    -> VolunteerCard, 'Schedule Call' button, schedule/[matchId] flow")
        idx += 1

    # 2. PENDING (second, for multiple cards)
    if idx < len(volunteers):
        suggested = create_future_time_blocks(session, 4)
        m = create_match(
            session,
            test_participant,
            volunteers[idx],
            "pending",
            suggested_time_blocks=suggested,
        )
        print(
            f"  [pending]                  Match #{m.id} with {volunteers[idx].first_name} {volunteers[idx].last_name}"
        )
        idx += 1

    # 3. CONFIRMED — ConfirmedMatchCard, cancel flow
    if idx < len(volunteers):
        chosen = create_future_time_block(session)
        m = create_match(
            session,
            test_participant,
            volunteers[idx],
            "confirmed",
            chosen_time_block=chosen,
        )
        print(
            f"  [confirmed]                Match #{m.id} with {volunteers[idx].first_name} {volunteers[idx].last_name}"
        )
        print("    -> ConfirmedMatchCard, scheduled calls, cancel call flow")
        idx += 1

    # 4. REQUESTING_NEW_TIMES — waiting for volunteer response
    if idx < len(volunteers):
        suggested = create_future_time_blocks(session, 6)
        m = create_match(
            session,
            test_participant,
            volunteers[idx],
            "requesting_new_times",
            suggested_time_blocks=suggested,
        )
        print(
            f"  [requesting_new_times]     Match #{m.id} with {volunteers[idx].first_name} {volunteers[idx].last_name}"
        )
        print("    -> 'Pending' badge on VolunteerCard")
        idx += 1

    # 5. CANCELLED_BY_VOLUNTEER — notification on load
    if idx < len(volunteers):
        m = create_match(session, test_participant, volunteers[idx], "cancelled_by_volunteer")
        print(
            f"  [cancelled_by_volunteer]   Match #{m.id} with {volunteers[idx].first_name} {volunteers[idx].last_name}"
        )
        print("    -> Notification modal on dashboard load")
        idx += 1


def seed_volunteer_perspective(session: Session, test_volunteer: User) -> None:
    """
    Matches visible when logged in as the TEST VOLUNTEER.
    Paired with seeded participants so the volunteer sees various match states.
    """
    print("\n=== VOLUNTEER perspective ===")
    print(f"(Log in as {TEST_VOLUNTEER_EMAIL})\n")

    participants = []
    for email in SEED_PARTICIPANT_EMAILS:
        p = get_user_by_email(session, email)
        if p:
            participants.append(p)

    if len(participants) < 4:
        print(f"  Warning: only found {len(participants)}/4 seeded participants")

    idx = 0

    # 1. PENDING — ProfileCard with "Schedule Call"
    if idx < len(participants):
        suggested = create_future_time_blocks(session, 6)
        m = create_match(
            session,
            participants[idx],
            test_volunteer,
            "pending",
            suggested_time_blocks=suggested,
        )
        print(
            f"  [pending]                  Match #{m.id} with {participants[idx].first_name} {participants[idx].last_name}"
        )
        print("    -> ProfileCard, 'Schedule Call' button")
        idx += 1

    # 2. PENDING (second)
    if idx < len(participants):
        suggested = create_future_time_blocks(session, 4)
        m = create_match(
            session,
            participants[idx],
            test_volunteer,
            "pending",
            suggested_time_blocks=suggested,
        )
        print(
            f"  [pending]                  Match #{m.id} with {participants[idx].first_name} {participants[idx].last_name}"
        )
        idx += 1

    # 3. CONFIRMED — scheduled call details, cancel, view contact
    if idx < len(participants):
        chosen = create_future_time_block(session)
        m = create_match(
            session,
            participants[idx],
            test_volunteer,
            "confirmed",
            chosen_time_block=chosen,
        )
        print(
            f"  [confirmed]                Match #{m.id} with {participants[idx].first_name} {participants[idx].last_name}"
        )
        print("    -> Scheduled calls page, view contact details, cancel flow")
        idx += 1

    # 4. REQUESTING_NEW_TIMES — time-request page
    if idx < len(participants):
        suggested = create_future_time_blocks(session, 6)
        m = create_match(
            session,
            participants[idx],
            test_volunteer,
            "requesting_new_times",
            suggested_time_blocks=suggested,
        )
        print(
            f"  [requesting_new_times]     Match #{m.id} with {participants[idx].first_name} {participants[idx].last_name}"
        )
        print("    -> TimeRequestNotificationModal on dashboard load")
        print("    -> time-request/[matchId] page with date/time selection")
        idx += 1

    # CANCELLED_BY_PARTICIPANT — use the first participant again
    if len(participants) > 0:
        m = create_match(session, participants[0], test_volunteer, "cancelled_by_participant")
        print(
            f"  [cancelled_by_participant] Match #{m.id} with {participants[0].first_name} {participants[0].last_name}"
        )
        print("    -> CallCancelledNotificationModal on dashboard load")


def print_test_checklist() -> None:
    print("\n" + "=" * 70)
    print("MOBILE TESTING CHECKLIST")
    print("=" * 70)
    print(f"""
Open http://localhost:3000 in Chrome, press F12 -> Cmd+Shift+M -> iPhone 14

PARTICIPANT FLOWS (log in as {TEST_PARTICIPANT_EMAIL}):
  [ ] Dashboard: VolunteerCards for pending matches (mobile cards, not table)
  [ ] Dashboard: ConfirmedMatchCard for confirmed match with call time
  [ ] Dashboard: "Pending" badge on requesting_new_times match
  [ ] Dashboard: cancelled_by_volunteer notification modal on load
  [ ] Dashboard: hamburger menu opens drawer with nav items
  [ ] Schedule Call: tap "Schedule Call" -> date -> time -> confirm -> success
  [ ] Request New Times: from scheduling page -> calendar -> time scheduler
  [ ] Cancel Call: from confirmed match -> confirmation modal -> success
  [ ] Edit Profile -> Personal Details tab
  [ ] Edit Profile -> History tab
  [ ] Contact form: via hamburger menu
  [ ] Opt Out form: feedback textarea, Cancel/Opt Out buttons
  [ ] Become Volunteer form: multi-step intake

VOLUNTEER FLOWS (log in as {TEST_VOLUNTEER_EMAIL}):
  [ ] Dashboard: ProfileCards for pending matches (mobile cards, not table)
  [ ] Dashboard: TimeRequestNotificationModal on load (requesting_new_times)
  [ ] Dashboard: CallCancelledNotificationModal on load (cancelled_by_participant)
  [ ] Dashboard: hamburger menu opens drawer with nav items
  [ ] Dashboard empty state: "No new matches" (clear session storage first)
  [ ] Time Request page: date boxes, time chips, Decline All / Confirm buttons
  [ ] Scheduled Calls: confirmed call details, cancel flow, view contact
  [ ] Edit Profile -> Personal Details tab
  [ ] Edit Profile -> History tab
  [ ] Edit Profile -> Availability tab: day pills + time slots
  [ ] Schedule availability (first-time): /volunteer/schedule
  [ ] FAQs page
  [ ] Match History page
  [ ] Contact form
  [ ] Become Participant form

BREAKPOINT TESTING:
  [ ] Resize from 320px to 768px — no content jumps or overflow
  [ ] Test at 375px (iPhone SE), 393px (iPhone 14), 430px (iPhone 14 Pro Max)

TIP: Notification modals use sessionStorage. To re-trigger them,
     open DevTools -> Application -> Session Storage -> Clear All,
     then refresh the page.
""")


def main():
    session: Session = SessionLocal()

    try:
        print("=" * 70)
        print("LLSC Mobile Testing — Match State Seeder")
        print("=" * 70)

        # 1. Look up Firebase UIDs
        print("\n--- Firebase setup ---")
        init_firebase()

        participant_uid = get_firebase_uid(TEST_PARTICIPANT_EMAIL)
        if not participant_uid:
            print(f"  ERROR: {TEST_PARTICIPANT_EMAIL} not found in Firebase!")
            print("  Create this account first (sign up via the app or Firebase console)")
            return

        volunteer_uid = get_firebase_uid(TEST_VOLUNTEER_EMAIL)
        if not volunteer_uid:
            print(f"  ERROR: {TEST_VOLUNTEER_EMAIL} not found in Firebase!")
            print("  Create this account first (sign up via the app or Firebase console)")
            return

        print(f"  {TEST_PARTICIPANT_EMAIL} -> Firebase UID: {participant_uid}")
        print(f"  {TEST_VOLUNTEER_EMAIL}   -> Firebase UID: {volunteer_uid}")

        # Verify emails in Firebase
        verify_firebase_email(TEST_PARTICIPANT_EMAIL)
        verify_firebase_email(TEST_VOLUNTEER_EMAIL)
        print("  Emails verified in Firebase")

        # 2. Set up DB users
        print("\n--- Database setup ---")
        clear_existing_matches(session)

        test_participant = ensure_test_participant(session, TEST_PARTICIPANT_EMAIL, participant_uid)
        test_volunteer = ensure_test_volunteer(session, TEST_VOLUNTEER_EMAIL, volunteer_uid)

        # 3. Create matches
        seed_participant_perspective(session, test_participant)
        seed_volunteer_perspective(session, test_volunteer)

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
