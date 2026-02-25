"""Script to create matches for a participant user."""

import sys
import traceback
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

from dotenv import load_dotenv
from sqlalchemy.orm import Session, joinedload

# Add the backend directory to the path so we can import app modules
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))  # noqa: E402

from app.models.AvailabilityTemplate import AvailabilityTemplate  # noqa: E402
from app.models.Match import Match  # noqa: E402
from app.models.MatchStatus import MatchStatus  # noqa: E402
from app.models.Role import Role  # noqa: E402
from app.models.TimeBlock import TimeBlock  # noqa: E402
from app.models.User import User  # noqa: E402
from app.utilities.db_utils import SessionLocal  # noqa: E402
from app.utilities.timezone_utils import get_timezone_from_abbreviation  # noqa: E402

load_dotenv()


def attach_suggested_times(session: Session, match: Match, volunteer: User) -> None:
    """
    Projects volunteer's availability templates onto the next 2 weeks
    and creates TimeBlocks for the match's suggested times.
    """
    now = datetime.now(timezone.utc)

    # Get active availability templates for this volunteer
    templates = session.query(AvailabilityTemplate).filter_by(user_id=volunteer.id, is_active=True).all()

    if not templates:
        print(f"  ⚠️  No availability templates found for {volunteer.email}")
        return

    # Get volunteer's timezone from user_data
    volunteer_tz: ZoneInfo | None = None
    if volunteer.user_data and volunteer.user_data.timezone:
        volunteer_tz = get_timezone_from_abbreviation(volunteer.user_data.timezone)

    # Default to UTC if no timezone is set
    if not volunteer_tz:
        print(f"  ⚠️  Volunteer {volunteer.email} has no timezone set, using UTC")
        volunteer_tz = timezone.utc

    # Project templates 8 days ahead (1 week + 1 day)
    projection_days = 8
    blocks_created = 0

    for day_offset in range(projection_days):
        # Calculate target date in UTC
        target_date_utc = now + timedelta(days=day_offset)

        # Convert UTC date to volunteer's local date to get the correct weekday
        target_date_local = target_date_utc.astimezone(volunteer_tz).date()
        target_day_of_week = target_date_local.weekday()  # 0=Mon, 6=Sun

        # Find templates that match this day of week
        for template in templates:
            if template.day_of_week == target_day_of_week:
                # Create datetime in volunteer's local timezone
                current_time_local = datetime.combine(target_date_local, template.start_time).replace(
                    tzinfo=volunteer_tz
                )
                end_time_local = datetime.combine(target_date_local, template.end_time).replace(tzinfo=volunteer_tz)

                # Convert to UTC for storage
                current_time_utc = current_time_local.astimezone(timezone.utc)
                end_time_utc = end_time_local.astimezone(timezone.utc)

                while current_time_utc < end_time_utc:
                    # Ensure we don't add blocks in the past
                    if current_time_utc >= now:
                        new_block = TimeBlock(start_time=current_time_utc)
                        match.suggested_time_blocks.append(new_block)
                        blocks_created += 1

                    current_time_utc += timedelta(minutes=30)

    if blocks_created > 0:
        print(f"  ✅ Attached {blocks_created} suggested time blocks")


def create_matches_for_participant():
    """Create 5 matches for yashkoth7@gmail.com."""
    session: Session = SessionLocal()

    try:
        # Find the participant user
        participant_email = "yashkoth7@gmail.com"
        participant = session.query(User).filter(User.email == participant_email).first()

        if not participant:
            print(f"❌ Participant user with email {participant_email} not found!")
            return

        # Verify they are a participant
        participant_role = session.query(Role).filter(Role.id == participant.role_id).first()
        if not participant_role or participant_role.name != "participant":
            print(
                f"❌ User {participant_email} is not a participant (role: {participant_role.name if participant_role else 'unknown'})"
            )
            return

        print(f"✅ Found participant: {participant.first_name} {participant.last_name} ({participant_email})")

        # Get match statuses
        pending_status = session.query(MatchStatus).filter(MatchStatus.name == "pending").first()
        awaiting_status = session.query(MatchStatus).filter(MatchStatus.name == "awaiting_volunteer_acceptance").first()
        confirmed_status = session.query(MatchStatus).filter(MatchStatus.name == "confirmed").first()

        if not pending_status:
            print("❌ 'pending' match status not found!")
            return
        if not awaiting_status:
            print("❌ 'awaiting_volunteer_acceptance' match status not found!")
            return
        if not confirmed_status:
            print("❌ 'confirmed' match status not found!")
            return

        # Find 4 volunteers from seed data
        seed_volunteer_emails = [
            "david.thompson@example.com",
            "jennifer.kim@example.com",
            "robert.williams@example.com",
            "emily.chen@example.com",
        ]

        volunteers = []
        for email in seed_volunteer_emails:
            volunteer = session.query(User).options(joinedload(User.user_data)).filter(User.email == email).first()
            if volunteer:
                volunteer_role = session.query(Role).filter(Role.id == volunteer.role_id).first()
                if volunteer_role and volunteer_role.name == "volunteer":
                    volunteers.append(volunteer)
                    print(f"✅ Found volunteer: {volunteer.first_name} {volunteer.last_name} ({email})")
                else:
                    print(
                        f"⚠️  User {email} is not a volunteer (role: {volunteer_role.name if volunteer_role else 'unknown'})"
                    )
            else:
                print(f"⚠️  Volunteer with email {email} not found")

        if len(volunteers) < 4:
            print(f"❌ Only found {len(volunteers)} volunteers, need 4!")
            return

        # Find or create the volunteer with yashkothari@uwblueprint.org
        special_volunteer_email = "yashkothari@uwblueprint.org"
        special_volunteer = (
            session.query(User)
            .options(joinedload(User.user_data))
            .filter(User.email == special_volunteer_email)
            .first()
        )

        if not special_volunteer:
            # Create the volunteer user
            volunteer_role = session.query(Role).filter(Role.name == "volunteer").first()
            if not volunteer_role:
                print("❌ Volunteer role not found!")
                return

            special_volunteer = User(
                id=uuid.uuid4(),
                first_name="Yash",
                last_name="Kothari",
                email=special_volunteer_email,
                role_id=volunteer_role.id,
                auth_id=f"auth_{special_volunteer_email.replace('@', '_at_')}",
                approved=True,
                active=True,
            )
            session.add(special_volunteer)
            session.flush()
            print(
                f"✅ Created volunteer: {special_volunteer.first_name} {special_volunteer.last_name} ({special_volunteer_email})"
            )
        else:
            volunteer_role = session.query(Role).filter(Role.id == special_volunteer.role_id).first()
            if not volunteer_role or volunteer_role.name != "volunteer":
                print(
                    f"⚠️  User {special_volunteer_email} exists but is not a volunteer (role: {volunteer_role.name if volunteer_role else 'unknown'})"
                )
                return
            print(
                f"✅ Found volunteer: {special_volunteer.first_name} {special_volunteer.last_name} ({special_volunteer_email})"
            )

        # Create 4 matches with "pending" status
        print("\n📝 Creating matches...")
        created_matches = []

        for idx, volunteer in enumerate(volunteers[:4]):
            # Check if match already exists
            existing_match = (
                session.query(Match)
                .filter(Match.participant_id == participant.id)
                .filter(Match.volunteer_id == volunteer.id)
                .filter(Match.deleted_at.is_(None))
                .first()
            )

            # All matches should be pending
            target_status = pending_status
            status_name = "pending"

            if existing_match:
                session.refresh(existing_match)

                # Update the status if needed
                if existing_match.match_status_id != target_status.id:
                    existing_match.match_status_id = target_status.id
                    # Clear chosen time block if it was set (since we're making it pending)
                    if existing_match.chosen_time_block_id:
                        existing_match.chosen_time_block_id = None
                    session.add(existing_match)
                    print(f"✅ Updated existing match with {volunteer.email} to {status_name} status")
                else:
                    print(f"✅ Match already exists with correct status ({status_name}) for {volunteer.email}")

                # Attach suggested times if match doesn't have any
                if len(existing_match.suggested_time_blocks) == 0:
                    print(f"  📅 Attaching suggested times for {volunteer.email}...")
                    attach_suggested_times(session, existing_match, volunteer)
                else:
                    print(f"  ✅ Match already has {len(existing_match.suggested_time_blocks)} suggested time blocks")
                continue

            match = Match(
                participant_id=participant.id,
                volunteer_id=volunteer.id,
                match_status_id=target_status.id,
            )
            session.add(match)
            session.flush()  # Flush to get match ID

            # Attach suggested times for pending matches
            print(
                f"✅ Created {status_name} match with {volunteer.first_name} {volunteer.last_name} ({volunteer.email})"
            )
            print("  📅 Attaching suggested times...")
            attach_suggested_times(session, match, volunteer)

            created_matches.append(match)

        # Create 1 match with "awaiting_volunteer_acceptance" status
        existing_special_match = (
            session.query(Match)
            .filter(Match.participant_id == participant.id)
            .filter(Match.volunteer_id == special_volunteer.id)
            .filter(Match.deleted_at.is_(None))
            .first()
        )

        if existing_special_match:
            # Update the status if it's not already awaiting_volunteer_acceptance
            if existing_special_match.match_status_id != awaiting_status.id:
                existing_special_match.match_status_id = awaiting_status.id
                session.add(existing_special_match)
                print(
                    f"✅ Updated existing match with {special_volunteer.email} to awaiting_volunteer_acceptance status"
                )
            else:
                print(
                    f"✅ Match already exists with correct status (awaiting_volunteer_acceptance) for {special_volunteer.email}"
                )
        else:
            match = Match(
                participant_id=participant.id,
                volunteer_id=special_volunteer.id,
                match_status_id=awaiting_status.id,
            )
            session.add(match)
            created_matches.append(match)
            print(
                f"✅ Created awaiting_volunteer_acceptance match with {special_volunteer.first_name} {special_volunteer.last_name} ({special_volunteer_email})"
            )

        # Commit all changes
        session.commit()
        print(f"\n🎉 Successfully created {len(created_matches)} matches!")

    except Exception as e:
        session.rollback()
        print(f"❌ Error creating matches: {str(e)}")
        traceback.print_exc()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    create_matches_for_participant()
