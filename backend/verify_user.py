#!/usr/bin/env python3
"""
Quick script to manually verify a user's email in Firebase.
Usage: python verify_user.py <email>
"""

import sys

import firebase_admin
from firebase_admin import auth, credentials


def verify_user_email(email: str):
    """Verify a user's email in Firebase."""
    try:
        # Initialize Firebase Admin if not already initialized
        if not firebase_admin._apps:
            cred = credentials.Certificate("serviceAccountKey.json")
            firebase_admin.initialize_app(cred)

        # Get user by email
        user = auth.get_user_by_email(email)

        # Update email_verified to True
        auth.update_user(user.uid, email_verified=True)

        print(f"✅ Successfully verified email for: {email}")
        print(f"   User ID: {user.uid}")
        return True

    except auth.UserNotFoundError:
        print(f"❌ Error: User with email {email} not found in Firebase")
        return False
    except Exception as e:
        print(f"❌ Error verifying email: {str(e)}")
        return False


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python verify_user.py <email>")
        print("Example: python verify_user.py abcd123@gmail.com")
        sys.exit(1)

    email = sys.argv[1]
    success = verify_user_email(email)
    sys.exit(0 if success else 1)
