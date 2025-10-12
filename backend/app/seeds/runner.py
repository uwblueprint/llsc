"""Database seeding runner."""

import argparse
import logging
import os
import sys

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.utilities.constants import LOGGER_NAME

# Import all seed functions
from .experiences import seed_experiences
from .forms import seed_forms
from .qualities import seed_qualities
from .ranking_preferences import seed_ranking_preferences
from .roles import seed_roles
from .treatments import seed_treatments
from .users import seed_users
from .match_status import seed_match_status

# Load environment variables
load_dotenv()

log = logging.getLogger(LOGGER_NAME("seeds"))


def get_database_session():
    """Create a database session for seeding."""
    database_url = os.getenv("POSTGRES_DATABASE_URL")
    if not database_url:
        raise ValueError("POSTGRES_DATABASE_URL environment variable is required")

    engine = create_engine(database_url)
    SessionLocal = sessionmaker(bind=engine)
    return SessionLocal()


def seed_database(verbose: bool = True) -> None:
    """
    Run all database seeding functions.

    Args:
        verbose: Whether to print detailed output
    """
    if verbose:
        print("🌱 Starting database seeding...")

    session = get_database_session()

    try:
        # Run all seed functions in dependency order
        seed_functions = [
            ("Roles", seed_roles),
            ("Treatments", seed_treatments),
            ("Experiences", seed_experiences),
            ("Qualities", seed_qualities),
            ("Forms", seed_forms),
            ("Users", seed_users),
            ("Ranking Preferences", seed_ranking_preferences),
            ("Match Status", seed_match_status),
        ]

        for name, seed_func in seed_functions:
            if verbose:
                print(f"\n📦 Seeding {name}...")
            try:
                seed_func(session)
                if verbose:
                    print(f"✅ {name} seeded successfully")
            except Exception as e:
                print(f"❌ Error seeding {name}: {str(e)}")
                log.error(f"Error seeding {name}: {str(e)}")
                raise

        if verbose:
            print("\n🎉 Database seeding completed successfully!")

    except Exception as e:
        session.rollback()
        if verbose:
            print(f"\n❌ Database seeding failed: {str(e)}")
        raise
    finally:
        session.close()


def main():
    """CLI entry point for database seeding."""

    parser = argparse.ArgumentParser(description="Seed the LLSC database with reference data")
    parser.add_argument("--quiet", "-q", action="store_true", help="Suppress output")
    parser.add_argument("--env", help="Environment (currently unused but for future extension)")

    args = parser.parse_args()

    try:
        seed_database(verbose=not args.quiet)
        sys.exit(0)
    except Exception as e:
        print(f"Seeding failed: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
