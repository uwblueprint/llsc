#!/usr/bin/env python3
"""
Test script to send various email templates to test addresses
This verifies deliverability and template rendering
"""

from dotenv import load_dotenv

from app.utilities.ses_email_service import SESEmailService

# Load environment variables
load_dotenv()

# Test email addresses
TEST_EMAILS = [
    "yashkothari@uwblueprint.org",
    "ykykyk017@gmail.com",
]


def send_test_emails():
    """Send a variety of test emails in both English and French"""
    ses_service = SESEmailService()

    print("=" * 60)
    print("EMAIL TEMPLATE TESTING")
    print("=" * 60)
    print(f"\nSending to: {', '.join(TEST_EMAILS)}")
    print(f"English Source: {ses_service.source_email_en}")
    print(f"French Source: {ses_service.source_email_fr}")
    print("\n" + "=" * 60 + "\n")

    # Test 1: Email Verification (EN)
    print("1. Sending Email Verification (EN)...")
    for email in TEST_EMAILS:
        result = ses_service.send_verification_email(
            to_email=email,
            verification_link="https://localhost:3000/action?mode=verifyEmail&oobCode=TEST123",
            first_name="Yash",
            language="en",
        )
        print(f"   → {email}: {'✓ Sent' if result else '✗ Failed'}")

    # Test 2: Email Verification (FR)
    print("\n2. Sending Email Verification (FR)...")
    for email in TEST_EMAILS:
        result = ses_service.send_verification_email(
            to_email=email,
            verification_link="https://localhost:3000/action?mode=verifyEmail&oobCode=TEST123",
            first_name="Yash",
            language="fr",
        )
        print(f"   → {email}: {'✓ Sent' if result else '✗ Failed'}")

    # Test 3: Password Reset (EN)
    print("\n3. Sending Password Reset (EN)...")
    for email in TEST_EMAILS:
        result = ses_service.send_password_reset_email(
            to_email=email,
            reset_link="https://localhost:3000/set-new-password?oobCode=TEST456",
            first_name="Yash",
            language="en",
        )
        print(f"   → {email}: {'✓ Sent' if result else '✗ Failed'}")

    # Test 4: Password Reset (FR)
    print("\n4. Sending Password Reset (FR)...")
    for email in TEST_EMAILS:
        result = ses_service.send_password_reset_email(
            to_email=email,
            reset_link="https://localhost:3000/set-new-password?oobCode=TEST456",
            first_name="Yash",
            language="fr",
        )
        print(f"   → {email}: {'✓ Sent' if result else '✗ Failed'}")

    # Test 5: Intake Form Confirmation (EN)
    print("\n5. Sending Intake Form Confirmation (EN)...")
    for email in TEST_EMAILS:
        result = ses_service.send_intake_form_confirmation_email(to_email=email, first_name="Yash", language="en")
        print(f"   → {email}: {'✓ Sent' if result else '✗ Failed'}")

    # Test 6: Intake Form Confirmation (FR)
    print("\n6. Sending Intake Form Confirmation (FR)...")
    for email in TEST_EMAILS:
        result = ses_service.send_intake_form_confirmation_email(to_email=email, first_name="Yash", language="fr")
        print(f"   → {email}: {'✓ Sent' if result else '✗ Failed'}")

    # Test 7: Matches Available (EN)
    print("\n7. Sending Matches Available (EN)...")
    for email in TEST_EMAILS:
        result = ses_service.send_matches_available_email(
            to_email=email,
            first_name="Yash",
            matches_url="http://localhost:3000/participant/dashboard",
            language="en",
        )
        print(f"   → {email}: {'✓ Sent' if result else '✗ Failed'}")

    # Test 8: Matches Available (FR)
    print("\n8. Sending Matches Available (FR)...")
    for email in TEST_EMAILS:
        result = ses_service.send_matches_available_email(
            to_email=email,
            first_name="Yash",
            matches_url="http://localhost:3000/participant/dashboard",
            language="fr",
        )
        print(f"   → {email}: {'✓ Sent' if result else '✗ Failed'}")

    # Test 9: Call Scheduled (EN)
    print("\n9. Sending Call Scheduled (EN)...")
    for email in TEST_EMAILS:
        result = ses_service.send_call_scheduled_email(
            to_email=email,
            match_name="Dr. Sarah Johnson",
            date="January 25, 2025",
            time="2:00 PM",
            timezone="EST",
            first_name="Yash",
            scheduled_calls_url="http://localhost:3000/participant/dashboard",
            language="en",
        )
        print(f"   → {email}: {'✓ Sent' if result else '✗ Failed'}")

    # Test 10: Call Scheduled (FR)
    print("\n10. Sending Call Scheduled (FR)...")
    for email in TEST_EMAILS:
        result = ses_service.send_call_scheduled_email(
            to_email=email,
            match_name="Dr. Marie Dubois",
            date="25 janvier 2025",
            time="14h00",
            timezone="EST",
            first_name="Yash",
            scheduled_calls_url="http://localhost:3000/participant/dashboard",
            language="fr",
        )
        print(f"   → {email}: {'✓ Sent' if result else '✗ Failed'}")

    # Test 11: Participant Requested New Times (EN) - Volunteer only
    print("\n11. Sending Participant Requested New Times (EN)...")
    for email in TEST_EMAILS:
        result = ses_service.send_participant_requested_new_times_email(
            to_email=email,
            participant_name="John Smith",
            first_name="Yash",
            matches_url="http://localhost:3000/volunteer/dashboard",
            language="en",
        )
        print(f"   → {email}: {'✓ Sent' if result else '✗ Failed'}")

    # Test 12: Participant Requested New Times (FR) - Volunteer only
    print("\n12. Sending Participant Requested New Times (FR)...")
    for email in TEST_EMAILS:
        result = ses_service.send_participant_requested_new_times_email(
            to_email=email,
            participant_name="Jean Tremblay",
            first_name="Yash",
            matches_url="http://localhost:3000/volunteer/dashboard",
            language="fr",
        )
        print(f"   → {email}: {'✓ Sent' if result else '✗ Failed'}")

    # Test 13: Volunteer Accepted New Times (EN) - Participant only
    print("\n13. Sending Volunteer Accepted New Times (EN)...")
    for email in TEST_EMAILS:
        result = ses_service.send_volunteer_accepted_new_times_email(
            to_email=email,
            volunteer_name="Dr. Sarah Johnson",
            date="January 28, 2025",
            time="3:30 PM",
            timezone="EST",
            first_name="Yash",
            scheduled_calls_url="http://localhost:3000/participant/dashboard",
            language="en",
        )
        print(f"   → {email}: {'✓ Sent' if result else '✗ Failed'}")

    # Test 14: Volunteer Accepted New Times (FR) - Participant only
    print("\n14. Sending Volunteer Accepted New Times (FR)...")
    for email in TEST_EMAILS:
        result = ses_service.send_volunteer_accepted_new_times_email(
            to_email=email,
            volunteer_name="Dr. Marie Dubois",
            date="28 janvier 2025",
            time="15h30",
            timezone="EST",
            first_name="Yash",
            scheduled_calls_url="http://localhost:3000/participant/dashboard",
            language="fr",
        )
        print(f"   → {email}: {'✓ Sent' if result else '✗ Failed'}")

    # Test 15: Participant Cancelled (EN) - Volunteer only
    print("\n15. Sending Participant Cancelled (EN)...")
    for email in TEST_EMAILS:
        result = ses_service.send_participant_cancelled_email(
            to_email=email,
            participant_name="John Smith",
            date="January 30, 2025",
            time="10:00 AM",
            timezone="EST",
            first_name="Yash",
            dashboard_url="http://localhost:3000/volunteer/dashboard",
            language="en",
        )
        print(f"   → {email}: {'✓ Sent' if result else '✗ Failed'}")

    # Test 16: Participant Cancelled (FR) - Volunteer only
    print("\n16. Sending Participant Cancelled (FR)...")
    for email in TEST_EMAILS:
        result = ses_service.send_participant_cancelled_email(
            to_email=email,
            participant_name="Jean Tremblay",
            date="30 janvier 2025",
            time="10h00",
            timezone="EST",
            first_name="Yash",
            dashboard_url="http://localhost:3000/volunteer/dashboard",
            language="fr",
        )
        print(f"   → {email}: {'✓ Sent' if result else '✗ Failed'}")

    # Test 17: Volunteer Cancelled (EN) - Participant only
    print("\n17. Sending Volunteer Cancelled (EN)...")
    for email in TEST_EMAILS:
        result = ses_service.send_volunteer_cancelled_email(
            to_email=email,
            volunteer_name="Dr. Sarah Johnson",
            date="January 30, 2025",
            time="10:00 AM",
            timezone="EST",
            first_name="Yash",
            request_matches_url="http://localhost:3000/participant/dashboard",
            language="en",
        )
        print(f"   → {email}: {'✓ Sent' if result else '✗ Failed'}")

    # Test 18: Volunteer Cancelled (FR) - Participant only
    print("\n18. Sending Volunteer Cancelled (FR)...")
    for email in TEST_EMAILS:
        result = ses_service.send_volunteer_cancelled_email(
            to_email=email,
            volunteer_name="Dr. Marie Dubois",
            date="30 janvier 2025",
            time="10h00",
            timezone="EST",
            first_name="Yash",
            request_matches_url="http://localhost:3000/participant/dashboard",
            language="fr",
        )
        print(f"   → {email}: {'✓ Sent' if result else '✗ Failed'}")

    # Test 19: Intake Approved - Participant (EN)
    print("\n19. Sending Intake Approved - Participant (EN)...")
    for email in TEST_EMAILS:
        result = ses_service.send_intake_approved_participant_email(
            to_email=email,
            first_name="Yash",
            ranking_url="http://localhost:3000/participant/ranking",
            language="en",
        )
        print(f"   → {email}: {'✓ Sent' if result else '✗ Failed'}")

    # Test 20: Intake Approved - Participant (FR)
    print("\n20. Sending Intake Approved - Participant (FR)...")
    for email in TEST_EMAILS:
        result = ses_service.send_intake_approved_participant_email(
            to_email=email,
            first_name="Yash",
            ranking_url="http://localhost:3000/participant/ranking",
            language="fr",
        )
        print(f"   → {email}: {'✓ Sent' if result else '✗ Failed'}")

    # Test 21: Intake Approved - Volunteer (EN)
    print("\n21. Sending Intake Approved - Volunteer (EN)...")
    for email in TEST_EMAILS:
        result = ses_service.send_intake_approved_volunteer_email(
            to_email=email,
            first_name="Yash",
            secondary_app_url="http://localhost:3000/volunteer/secondary-application",
            language="en",
        )
        print(f"   → {email}: {'✓ Sent' if result else '✗ Failed'}")

    # Test 22: Intake Approved - Volunteer (FR)
    print("\n22. Sending Intake Approved - Volunteer (FR)...")
    for email in TEST_EMAILS:
        result = ses_service.send_intake_approved_volunteer_email(
            to_email=email,
            first_name="Yash",
            secondary_app_url="http://localhost:3000/volunteer/secondary-application",
            language="fr",
        )
        print(f"   → {email}: {'✓ Sent' if result else '✗ Failed'}")

    # Test 23: Ranking Form Confirmation (EN)
    print("\n23. Sending Ranking Form Confirmation (EN)...")
    for email in TEST_EMAILS:
        result = ses_service.send_ranking_form_confirmation_email(
            to_email=email,
            first_name="Yash",
            language="en",
        )
        print(f"   → {email}: {'✓ Sent' if result else '✗ Failed'}")

    # Test 24: Ranking Form Confirmation (FR)
    print("\n24. Sending Ranking Form Confirmation (FR)...")
    for email in TEST_EMAILS:
        result = ses_service.send_ranking_form_confirmation_email(
            to_email=email,
            first_name="Yash",
            language="fr",
        )
        print(f"   → {email}: {'✓ Sent' if result else '✗ Failed'}")

    # Test 25: Ranking Approved (EN)
    print("\n25. Sending Ranking Approved (EN)...")
    for email in TEST_EMAILS:
        result = ses_service.send_ranking_approved_email(
            to_email=email,
            first_name="Yash",
            language="en",
        )
        print(f"   → {email}: {'✓ Sent' if result else '✗ Failed'}")

    # Test 26: Ranking Approved (FR)
    print("\n26. Sending Ranking Approved (FR)...")
    for email in TEST_EMAILS:
        result = ses_service.send_ranking_approved_email(
            to_email=email,
            first_name="Yash",
            language="fr",
        )
        print(f"   → {email}: {'✓ Sent' if result else '✗ Failed'}")

    # Test 27: Secondary App Confirmation (EN)
    print("\n27. Sending Secondary App Confirmation (EN)...")
    for email in TEST_EMAILS:
        result = ses_service.send_secondary_app_confirmation_email(
            to_email=email,
            first_name="Yash",
            language="en",
        )
        print(f"   → {email}: {'✓ Sent' if result else '✗ Failed'}")

    # Test 28: Secondary App Confirmation (FR)
    print("\n28. Sending Secondary App Confirmation (FR)...")
    for email in TEST_EMAILS:
        result = ses_service.send_secondary_app_confirmation_email(
            to_email=email,
            first_name="Yash",
            language="fr",
        )
        print(f"   → {email}: {'✓ Sent' if result else '✗ Failed'}")

    # Test 29: Secondary App Approved (EN)
    print("\n29. Sending Secondary App Approved (EN)...")
    for email in TEST_EMAILS:
        result = ses_service.send_secondary_app_approved_email(
            to_email=email,
            first_name="Yash",
            dashboard_url="http://localhost:3000/volunteer/dashboard",
            language="en",
        )
        print(f"   → {email}: {'✓ Sent' if result else '✗ Failed'}")

    # Test 30: Secondary App Approved (FR)
    print("\n30. Sending Secondary App Approved (FR)...")
    for email in TEST_EMAILS:
        result = ses_service.send_secondary_app_approved_email(
            to_email=email,
            first_name="Yash",
            dashboard_url="http://localhost:3000/volunteer/dashboard",
            language="fr",
        )
        print(f"   → {email}: {'✓ Sent' if result else '✗ Failed'}")

    print("\n" + "=" * 60)
    print("✓ All test emails sent!")
    print("=" * 60)
    print("\nPlease check your inboxes (including spam folders) for:")
    print("  - 30 different email sends (15 EN + 15 FR)")
    print("  - English emails from: FirstConnections@bloodcancers.ca")
    print("  - French emails from: PremierContact@bloodcancers.ca")
    print("\nVerify that:")
    print("  ✓ All emails are delivered")
    print("  ✓ Templates render correctly")
    print("  ✓ Parameters work in subject lines (e.g., 'Yash, confirm your email...')")
    print("  ✓ Parameters work in email bodies (e.g., 'Bonjour Yash,')")
    print("  ✓ French logo (PNG) displays in Gmail")
    print("  ✓ French emails use French footer and French text")
    print("  ✓ Links and buttons work")


if __name__ == "__main__":
    send_test_emails()
