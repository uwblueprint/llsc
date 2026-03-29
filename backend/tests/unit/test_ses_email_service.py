import json
import re
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from app.utilities.ses_email_service import SESEmailService

TEMPLATES_PATH = Path(__file__).resolve().parents[2] / "app" / "utilities" / "ses" / "ses_templates.json"
_TEMPLATES_BY_NAME: dict[str, dict] = {}


def _load_templates():
    if not _TEMPLATES_BY_NAME:
        with open(TEMPLATES_PATH) as f:
            for entry in json.load(f):
                _TEMPLATES_BY_NAME[entry["TemplateName"]] = entry


def _render_subject(mock_client) -> str:
    """Render the full subject line by substituting template data into the SubjectPart from ses_templates.json."""
    _load_templates()
    call_kwargs = mock_client.send_templated_email.call_args[1]
    template_name = call_kwargs["Template"]
    template_data = json.loads(call_kwargs["TemplateData"])
    subject_part = _TEMPLATES_BY_NAME[template_name]["SubjectPart"]
    return re.sub(r"\{\{(\w+)\}\}", lambda m: template_data.get(m.group(1), ""), subject_part)


@pytest.fixture
def ses_service(monkeypatch):
    monkeypatch.setenv("AWS_REGION", "us-east-1")
    monkeypatch.setenv("AWS_ACCESS_KEY", "fake")
    monkeypatch.setenv("AWS_SECRET_KEY", "fake")
    monkeypatch.setenv("SES_SOURCE_EMAIL", "test@example.com")

    with patch("app.utilities.ses_email_service.boto3.client") as mock_boto:
        mock_client = MagicMock()
        mock_client.send_templated_email.return_value = {"MessageId": "test-123"}
        mock_boto.return_value = mock_client

        service = SESEmailService()
        service._mock_client = mock_client
        yield service


def _get_template_data(mock_client) -> dict:
    """Extract the parsed template data from the most recent send_templated_email call."""
    call_kwargs = mock_client.send_templated_email.call_args[1]
    return json.loads(call_kwargs["TemplateData"])


def _get_template_name(mock_client) -> str:
    call_kwargs = mock_client.send_templated_email.call_args[1]
    return call_kwargs["Template"]


# ---------------------------------------------------------------------------
# _normalize_first_name
# ---------------------------------------------------------------------------
class TestNormalizeFirstName:
    def test_none(self, ses_service):
        assert ses_service._normalize_first_name(None) is None

    def test_empty(self, ses_service):
        assert ses_service._normalize_first_name("") is None

    def test_whitespace_only(self, ses_service):
        assert ses_service._normalize_first_name("   ") is None

    def test_normal_name(self, ses_service):
        assert ses_service._normalize_first_name("Yash") == "Yash"

    def test_strips_whitespace(self, ses_service):
        assert ses_service._normalize_first_name("  Yash  ") == "Yash"


# ---------------------------------------------------------------------------
# _build_name_template_data
# ---------------------------------------------------------------------------
class TestBuildNameTemplateData:
    def test_with_name(self, ses_service):
        result = ses_service._build_name_template_data("Yash")
        assert result["first_name"] == "Yash"
        assert result["subject_prefix"] == "Yash, "
        assert "subject_first_word" not in result

    def test_without_name(self, ses_service):
        result = ses_service._build_name_template_data(None)
        assert result["first_name"] == "there"
        assert result["subject_prefix"] == ""

    def test_empty_string_name(self, ses_service):
        result = ses_service._build_name_template_data("")
        assert result["first_name"] == "there"
        assert result["subject_prefix"] == ""

    def test_whitespace_name(self, ses_service):
        result = ses_service._build_name_template_data("   ")
        assert result["first_name"] == "there"
        assert result["subject_prefix"] == ""

    def test_subject_first_word_with_name(self, ses_service):
        result = ses_service._build_name_template_data("Yash", subject_first_word="confirm")
        assert result["subject_first_word"] == "confirm"

    def test_subject_first_word_capitalized_without_name(self, ses_service):
        result = ses_service._build_name_template_data(None, subject_first_word="confirm")
        assert result["subject_first_word"] == "Confirm"

    def test_subject_first_word_already_capitalized_without_name(self, ses_service):
        result = ses_service._build_name_template_data(None, subject_first_word="Your")
        assert result["subject_first_word"] == "Your"

    def test_subject_first_word_with_contraction(self, ses_service):
        result = ses_service._build_name_template_data(None, subject_first_word="you're")
        assert result["subject_first_word"] == "You're"

    def test_subject_first_word_with_name_stays_lowercase(self, ses_service):
        result = ses_service._build_name_template_data("Yash", subject_first_word="you're")
        assert result["subject_first_word"] == "you're"

    def test_subject_first_word_french_without_name(self, ses_service):
        result = ses_service._build_name_template_data(None, subject_first_word="votre")
        assert result["subject_first_word"] == "Votre"

    def test_subject_first_word_none_not_included(self, ses_service):
        result = ses_service._build_name_template_data("Yash", subject_first_word=None)
        assert "subject_first_word" not in result

    def test_subject_first_word_empty_not_included(self, ses_service):
        result = ses_service._build_name_template_data("Yash", subject_first_word="")
        assert "subject_first_word" not in result


# ---------------------------------------------------------------------------
# send_templated_email
# ---------------------------------------------------------------------------
class TestSendTemplatedEmail:
    def test_returns_true_on_success(self, ses_service):
        result = ses_service.send_templated_email("to@example.com", "TestTemplate", {"key": "value"})
        assert result is True
        ses_service._mock_client.send_templated_email.assert_called_once()

    def test_returns_false_when_client_is_none(self, ses_service):
        ses_service.ses_client = None
        result = ses_service.send_templated_email("to@example.com", "TestTemplate", {"key": "value"})
        assert result is False

    def test_passes_correct_args(self, ses_service):
        ses_service.send_templated_email("to@example.com", "MyTemplate", {"k": "v"}, "from@example.com")
        call_kwargs = ses_service._mock_client.send_templated_email.call_args[1]
        assert call_kwargs["Source"] == "from@example.com"
        assert call_kwargs["Destination"] == {"ToAddresses": ["to@example.com"]}
        assert call_kwargs["Template"] == "MyTemplate"
        assert json.loads(call_kwargs["TemplateData"]) == {"k": "v"}

    def test_uses_default_source_email(self, ses_service):
        ses_service.send_templated_email("to@example.com", "T", {})
        call_kwargs = ses_service._mock_client.send_templated_email.call_args[1]
        assert call_kwargs["Source"] == ses_service.source_email


# ---------------------------------------------------------------------------
# send_verification_email
# ---------------------------------------------------------------------------
class TestSendVerificationEmail:
    def test_english_with_name(self, ses_service):
        ses_service.send_verification_email(
            "to@example.com", "https://example.com/verify?token=abc", first_name="Yash", language="en"
        )
        data = _get_template_data(ses_service._mock_client)
        assert data["verification_link"] == "https://example.com/verify?token=abc"
        assert _get_template_name(ses_service._mock_client) == "EmailVerificationEn"
        assert _render_subject(ses_service._mock_client) == (
            "Yash, confirm your email - First Connection Peer Support Program"
        )

    def test_english_without_name(self, ses_service):
        ses_service.send_verification_email(
            "to@example.com", "https://example.com/verify?token=abc", language="en"
        )
        assert _render_subject(ses_service._mock_client) == (
            "Confirm your email - First Connection Peer Support Program"
        )

    def test_french_with_name(self, ses_service):
        ses_service.send_verification_email(
            "to@example.com", "https://example.com/verify?token=abc", first_name="Marie", language="fr"
        )
        assert _get_template_name(ses_service._mock_client) == "EmailVerificationFr"
        assert _render_subject(ses_service._mock_client) == (
            "Marie, confirmation de l'adresse courriel "
            "\u2013 Programme de soutien par les pairs Premier contact"
        )

    def test_french_without_name(self, ses_service):
        ses_service.send_verification_email(
            "to@example.com", "https://example.com/verify?token=abc", language="fr"
        )
        assert _render_subject(ses_service._mock_client) == (
            "Confirmation de l'adresse courriel "
            "\u2013 Programme de soutien par les pairs Premier contact"
        )


# ---------------------------------------------------------------------------
# send_password_reset_email
# ---------------------------------------------------------------------------
class TestSendPasswordResetEmail:
    def test_english(self, ses_service):
        ses_service.send_password_reset_email(
            "to@example.com", "https://example.com/reset?token=abc", first_name="Yash"
        )
        data = _get_template_data(ses_service._mock_client)
        assert data["first_name"] == "Yash"
        assert data["reset_link"] == "https://example.com/reset?token=abc"
        assert _get_template_name(ses_service._mock_client) == "PasswordResetEn"
        assert _render_subject(ses_service._mock_client) == (
            "Reset Your Password - First Connection Peer Support Program"
        )

    def test_french(self, ses_service):
        ses_service.send_password_reset_email(
            "to@example.com", "https://example.com/reset?token=abc", language="fr"
        )
        assert _get_template_name(ses_service._mock_client) == "PasswordResetFr"


# ---------------------------------------------------------------------------
# send_intake_form_confirmation_email
# ---------------------------------------------------------------------------
class TestSendIntakeFormConfirmationEmail:
    def test_with_name(self, ses_service):
        ses_service.send_intake_form_confirmation_email("to@example.com", first_name="Yash")
        data = _get_template_data(ses_service._mock_client)
        assert data["first_name"] == "Yash"
        assert _render_subject(ses_service._mock_client) == (
            "We received your intake form - First Connection Peer Support Program"
        )

    def test_without_name(self, ses_service):
        ses_service.send_intake_form_confirmation_email("to@example.com")
        data = _get_template_data(ses_service._mock_client)
        assert data["first_name"] == "there"


# ---------------------------------------------------------------------------
# send_matches_available_email
# ---------------------------------------------------------------------------
class TestSendMatchesAvailableEmail:
    def test_english_with_name(self, ses_service):
        ses_service.send_matches_available_email("to@example.com", first_name="Yash", language="en")
        assert _render_subject(ses_service._mock_client) == (
            "Yash, you have new matches - First Connection Peer Support Program"
        )

    def test_english_without_name(self, ses_service):
        ses_service.send_matches_available_email("to@example.com", language="en")
        assert _render_subject(ses_service._mock_client) == (
            "You have new matches - First Connection Peer Support Program"
        )

    def test_french_with_name(self, ses_service):
        ses_service.send_matches_available_email("to@example.com", first_name="Marie", language="fr")
        assert _render_subject(ses_service._mock_client) == (
            "Marie, nouveaux jumelages "
            "\u2013 Programme de soutien par les pairs Premier contact"
        )

    def test_french_without_name(self, ses_service):
        ses_service.send_matches_available_email("to@example.com", language="fr")
        assert _render_subject(ses_service._mock_client) == (
            "Nouveaux jumelages "
            "\u2013 Programme de soutien par les pairs Premier contact"
        )

    def test_default_matches_url(self, ses_service):
        ses_service.send_matches_available_email("to@example.com")
        data = _get_template_data(ses_service._mock_client)
        assert "/participant/dashboard" in data["matches_url"]


# ---------------------------------------------------------------------------
# send_call_scheduled_email
# ---------------------------------------------------------------------------
class TestSendCallScheduledEmail:
    def test_english(self, ses_service):
        ses_service.send_call_scheduled_email(
            "to@example.com",
            match_name="Jane Doe",
            date="March 22, 2026",
            time="10:00 AM",
            timezone="EST",
            first_name="Yash",
        )
        data = _get_template_data(ses_service._mock_client)
        assert data["first_name"] == "Yash"
        assert "/participant/dashboard" in data["scheduled_calls_url"]
        assert _render_subject(ses_service._mock_client) == (
            "Call confirmed with Jane Doe @ March 22, 2026 10:00 AM EST "
            "- First Connection Peer Support Program"
        )

    def test_french(self, ses_service):
        ses_service.send_call_scheduled_email(
            "to@example.com",
            match_name="Marie Dupont",
            date="22 mars 2026",
            time="10h00",
            timezone="HNE",
            language="fr",
        )
        assert _render_subject(ses_service._mock_client) == (
            "Confirmation de l'appel avec Marie Dupont le 22 mars 2026 "
            "\u00e0 10h00 HNE "
            "\u2013 Programme de soutien par les pairs Premier contact"
        )


# ---------------------------------------------------------------------------
# send_intake_approved_participant_email
# ---------------------------------------------------------------------------
class TestSendIntakeApprovedParticipantEmail:
    def test_english_with_name(self, ses_service):
        ses_service.send_intake_approved_participant_email("to@example.com", first_name="Yash", language="en")
        data = _get_template_data(ses_service._mock_client)
        assert "/participant/ranking" in data["ranking_url"]
        assert _render_subject(ses_service._mock_client) == (
            "Yash, your matching preferences form is ready - First Connection Peer Support Program"
        )

    def test_english_without_name(self, ses_service):
        ses_service.send_intake_approved_participant_email("to@example.com", language="en")
        assert _render_subject(ses_service._mock_client) == (
            "Your matching preferences form is ready - First Connection Peer Support Program"
        )


# ---------------------------------------------------------------------------
# send_intake_approved_volunteer_email
# ---------------------------------------------------------------------------
class TestSendIntakeApprovedVolunteerEmail:
    def test_english_with_name(self, ses_service):
        ses_service.send_intake_approved_volunteer_email("to@example.com", first_name="Yash", language="en")
        data = _get_template_data(ses_service._mock_client)
        assert "/volunteer/secondary-application" in data["secondary_app_url"]
        assert _render_subject(ses_service._mock_client) == (
            "Yash, your secondary application is ready - First Connection Peer Support Program"
        )

    def test_english_without_name(self, ses_service):
        ses_service.send_intake_approved_volunteer_email("to@example.com", language="en")
        assert _render_subject(ses_service._mock_client) == (
            "Your secondary application is ready - First Connection Peer Support Program"
        )

    def test_french_without_name(self, ses_service):
        ses_service.send_intake_approved_volunteer_email("to@example.com", language="fr")
        assert _render_subject(ses_service._mock_client) == (
            "Votre demande compl\u00e9mentaire est pr\u00eate "
            "\u2013 Programme de soutien par les pairs Premier contact"
        )


# ---------------------------------------------------------------------------
# send_ranking_form_confirmation_email
# ---------------------------------------------------------------------------
class TestSendRankingFormConfirmationEmail:
    def test_with_name(self, ses_service):
        ses_service.send_ranking_form_confirmation_email("to@example.com", first_name="Yash")
        data = _get_template_data(ses_service._mock_client)
        assert data["first_name"] == "Yash"
        assert _render_subject(ses_service._mock_client) == (
            "We received your matching preferences - First Connection Peer Support Program"
        )


# ---------------------------------------------------------------------------
# send_ranking_approved_email
# ---------------------------------------------------------------------------
class TestSendRankingApprovedEmail:
    def test_english_with_name(self, ses_service):
        ses_service.send_ranking_approved_email("to@example.com", first_name="Yash", language="en")
        assert _render_subject(ses_service._mock_client) == (
            "Yash, you're ready for matching - First Connection Peer Support Program"
        )

    def test_english_without_name(self, ses_service):
        ses_service.send_ranking_approved_email("to@example.com", language="en")
        assert _render_subject(ses_service._mock_client) == (
            "You're ready for matching - First Connection Peer Support Program"
        )

    def test_french_with_name(self, ses_service):
        ses_service.send_ranking_approved_email("to@example.com", first_name="Marie", language="fr")
        assert _render_subject(ses_service._mock_client) == (
            "Marie, vous \u00eates pr\u00eat(e) pour le jumelage "
            "\u2013 Programme de soutien par les pairs Premier contact"
        )

    def test_french_without_name(self, ses_service):
        ses_service.send_ranking_approved_email("to@example.com", language="fr")
        assert _render_subject(ses_service._mock_client) == (
            "Vous \u00eates pr\u00eat(e) pour le jumelage "
            "\u2013 Programme de soutien par les pairs Premier contact"
        )


# ---------------------------------------------------------------------------
# send_secondary_app_confirmation_email
# ---------------------------------------------------------------------------
class TestSendSecondaryAppConfirmationEmail:
    def test_with_name(self, ses_service):
        ses_service.send_secondary_app_confirmation_email("to@example.com", first_name="Yash")
        data = _get_template_data(ses_service._mock_client)
        assert data["first_name"] == "Yash"
        assert _render_subject(ses_service._mock_client) == (
            "We received your volunteer application - First Connection Peer Support Program"
        )


# ---------------------------------------------------------------------------
# send_secondary_app_approved_email
# ---------------------------------------------------------------------------
class TestSendSecondaryAppApprovedEmail:
    def test_english_with_name(self, ses_service):
        ses_service.send_secondary_app_approved_email("to@example.com", first_name="Yash", language="en")
        data = _get_template_data(ses_service._mock_client)
        assert "/volunteer/dashboard" in data["dashboard_url"]
        assert _render_subject(ses_service._mock_client) == (
            "Yash, your volunteer profile is complete - First Connection Peer Support Program"
        )

    def test_english_without_name(self, ses_service):
        ses_service.send_secondary_app_approved_email("to@example.com", language="en")
        assert _render_subject(ses_service._mock_client) == (
            "Your volunteer profile is complete - First Connection Peer Support Program"
        )


# ---------------------------------------------------------------------------
# send_participant_requested_new_times_email
# ---------------------------------------------------------------------------
class TestSendParticipantRequestedNewTimesEmail:
    def test_english(self, ses_service):
        ses_service.send_participant_requested_new_times_email(
            "to@example.com", participant_name="Jane Doe", first_name="Yash"
        )
        data = _get_template_data(ses_service._mock_client)
        assert data["first_name"] == "Yash"
        assert _render_subject(ses_service._mock_client) == (
            "Jane Doe requested new times - First Connection Peer Support Program"
        )


# ---------------------------------------------------------------------------
# send_volunteer_accepted_new_times_email
# ---------------------------------------------------------------------------
class TestSendVolunteerAcceptedNewTimesEmail:
    def test_english(self, ses_service):
        ses_service.send_volunteer_accepted_new_times_email(
            "to@example.com",
            volunteer_name="Jane Doe",
            date="March 22, 2026",
            time="10:00 AM",
            timezone="EST",
            first_name="Yash",
        )
        data = _get_template_data(ses_service._mock_client)
        assert data["first_name"] == "Yash"
        assert _get_template_name(ses_service._mock_client) == "VolunteerAcceptedNewTimesEn"
        assert _render_subject(ses_service._mock_client) == (
            "Jane Doe confirmed your new time @ March 22, 2026 10:00 AM EST "
            "- First Connection Peer Support Program"
        )


# ---------------------------------------------------------------------------
# send_participant_cancelled_email
# ---------------------------------------------------------------------------
class TestSendParticipantCancelledEmail:
    def test_english(self, ses_service):
        ses_service.send_participant_cancelled_email(
            "to@example.com",
            participant_name="Jane Doe",
            date="March 22, 2026",
            time="10:00 AM",
            timezone="EST",
            first_name="Yash",
        )
        data = _get_template_data(ses_service._mock_client)
        assert data["first_name"] == "Yash"
        assert "/volunteer/dashboard" in data["dashboard_url"]
        assert _render_subject(ses_service._mock_client) == (
            "Call cancelled by Jane Doe - First Connection Peer Support Program"
        )


# ---------------------------------------------------------------------------
# send_volunteer_cancelled_email
# ---------------------------------------------------------------------------
class TestSendVolunteerCancelledEmail:
    def test_english(self, ses_service):
        ses_service.send_volunteer_cancelled_email(
            "to@example.com",
            volunteer_name="Jane Doe",
            date="March 22, 2026",
            time="10:00 AM",
            timezone="EST",
            first_name="Yash",
        )
        data = _get_template_data(ses_service._mock_client)
        assert data["first_name"] == "Yash"
        assert "/participant/dashboard" in data["request_matches_url"]
        assert _render_subject(ses_service._mock_client) == (
            "Call cancelled by Jane Doe - First Connection Peer Support Program"
        )


# ---------------------------------------------------------------------------
# Language fallback
# ---------------------------------------------------------------------------
class TestLanguageFallback:
    def test_invalid_language_defaults_to_english(self, ses_service):
        ses_service.send_intake_form_confirmation_email("to@example.com", language="de")
        assert _get_template_name(ses_service._mock_client) == "IntakeFormConfirmationEn"

    def test_none_language_defaults_to_english(self, ses_service):
        ses_service.send_intake_form_confirmation_email("to@example.com", language=None)
        assert _get_template_name(ses_service._mock_client) == "IntakeFormConfirmationEn"

    def test_case_insensitive_language(self, ses_service):
        ses_service.send_intake_form_confirmation_email("to@example.com", language="FR")
        assert _get_template_name(ses_service._mock_client) == "IntakeFormConfirmationFr"
