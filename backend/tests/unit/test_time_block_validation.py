"""Unit tests for TimeRange schema validation.

Tests the TimeRange Pydantic model validation rules:
- Times must be on half-hour boundaries (:00 or :30)
- End time must be after start time
- Minimum duration of 30 minutes
- No seconds or microseconds allowed
"""

from datetime import datetime, timedelta

import pytest
from pydantic import ValidationError

from app.schemas.time_block import TimeRange


class TestTimeRangeValidation:
    """Test TimeRange schema validation without database"""

    # ========== VALID CASES ==========

    def test_valid_30_minute_window(self):
        """Valid: Exactly 30 minutes (10:00-10:30)"""
        tr = TimeRange(
            start_time=datetime(2025, 10, 15, 10, 0, 0),
            end_time=datetime(2025, 10, 15, 10, 30, 0),
        )
        assert tr.start_time.hour == 10
        assert tr.start_time.minute == 0
        assert tr.end_time.hour == 10
        assert tr.end_time.minute == 30

    def test_valid_1_hour_window(self):
        """Valid: 1 hour window (10:00-11:00)"""
        tr = TimeRange(
            start_time=datetime(2025, 10, 15, 10, 0, 0),
            end_time=datetime(2025, 10, 15, 11, 0, 0),
        )
        assert tr.start_time.hour == 10
        assert tr.end_time.hour == 11

    def test_valid_2_hour_window(self):
        """Valid: 2 hours (10:00-12:00)"""
        tr = TimeRange(
            start_time=datetime(2025, 10, 15, 10, 0, 0),
            end_time=datetime(2025, 10, 15, 12, 0, 0),
        )
        assert (tr.end_time - tr.start_time) == timedelta(hours=2)

    def test_valid_half_hour_start_and_end(self):
        """Valid: Both on half-hour (10:30-11:30)"""
        tr = TimeRange(
            start_time=datetime(2025, 10, 15, 10, 30, 0),
            end_time=datetime(2025, 10, 15, 11, 30, 0),
        )
        assert tr.start_time.minute == 30
        assert tr.end_time.minute == 30

    def test_valid_90_minute_window(self):
        """Valid: 90 minutes (10:00-11:30)"""
        tr = TimeRange(
            start_time=datetime(2025, 10, 15, 10, 0, 0),
            end_time=datetime(2025, 10, 15, 11, 30, 0),
        )
        assert (tr.end_time - tr.start_time) == timedelta(minutes=90)

    # ========== INVALID: MINIMUM DURATION ==========

    def test_reject_29_minute_window(self):
        """Invalid: 29 minutes is too short"""
        with pytest.raises(ValidationError) as exc_info:
            TimeRange(
                start_time=datetime(2025, 10, 15, 10, 0, 0),
                end_time=datetime(2025, 10, 15, 10, 29, 0),
            )
        # Should fail on half-hour boundary check (10:29 not valid)
        assert "half hour" in str(exc_info.value).lower()

    def test_reject_20_minute_window(self):
        """Invalid: 20 minutes is too short"""
        with pytest.raises(ValidationError) as exc_info:
            TimeRange(
                start_time=datetime(2025, 10, 15, 10, 0, 0),
                end_time=datetime(2025, 10, 15, 10, 20, 0),
            )
        assert "error" in str(exc_info.value).lower()

    def test_reject_exact_30_minute_window_with_invalid_end(self):
        """Invalid: 30 minutes but end not on half-hour (10:00-10:30:00 would work, but 10:00-10:29:59 fails)"""
        # This actually tests 29:59 which should fail on boundary check
        end_time = datetime(2025, 10, 15, 10, 0, 0) + timedelta(minutes=29, seconds=59)
        with pytest.raises(ValidationError) as exc_info:
            TimeRange(
                start_time=datetime(2025, 10, 15, 10, 0, 0),
                end_time=end_time,
            )
        # Should fail because end has seconds
        assert "error" in str(exc_info.value).lower()

    # ========== INVALID: BOUNDARIES ==========

    def test_reject_15_minute_start(self):
        """Invalid: Start time at :15"""
        with pytest.raises(ValidationError) as exc_info:
            TimeRange(
                start_time=datetime(2025, 10, 15, 10, 15, 0),
                end_time=datetime(2025, 10, 15, 11, 0, 0),
            )
        assert "half hour" in str(exc_info.value).lower()

    def test_reject_45_minute_start(self):
        """Invalid: Start time at :45"""
        with pytest.raises(ValidationError) as exc_info:
            TimeRange(
                start_time=datetime(2025, 10, 15, 10, 45, 0),
                end_time=datetime(2025, 10, 15, 11, 30, 0),
            )
        assert "half hour" in str(exc_info.value).lower()

    def test_reject_15_minute_end(self):
        """Invalid: End time at :15"""
        with pytest.raises(ValidationError) as exc_info:
            TimeRange(
                start_time=datetime(2025, 10, 15, 10, 0, 0),
                end_time=datetime(2025, 10, 15, 11, 15, 0),
            )
        assert "half hour" in str(exc_info.value).lower()

    def test_reject_45_minute_end(self):
        """Invalid: End time at :45"""
        with pytest.raises(ValidationError) as exc_info:
            TimeRange(
                start_time=datetime(2025, 10, 15, 10, 30, 0),
                end_time=datetime(2025, 10, 15, 11, 45, 0),
            )
        assert "half hour" in str(exc_info.value).lower()

    # ========== INVALID: TIME PRECISION ==========

    def test_reject_start_with_seconds(self):
        """Invalid: Start time has seconds"""
        with pytest.raises(ValidationError) as exc_info:
            TimeRange(
                start_time=datetime(2025, 10, 15, 10, 0, 30),
                end_time=datetime(2025, 10, 15, 11, 0, 0),
            )
        assert "half hour" in str(exc_info.value).lower()

    def test_reject_end_with_seconds(self):
        """Invalid: End time has seconds"""
        with pytest.raises(ValidationError) as exc_info:
            TimeRange(
                start_time=datetime(2025, 10, 15, 10, 0, 0),
                end_time=datetime(2025, 10, 15, 11, 0, 15),
            )
        assert "half hour" in str(exc_info.value).lower()

    def test_reject_with_microseconds(self):
        """Invalid: Time has microseconds"""
        with pytest.raises(ValidationError) as exc_info:
            TimeRange(
                start_time=datetime(2025, 10, 15, 10, 0, 0, 500000),  # 500ms
                end_time=datetime(2025, 10, 15, 11, 0, 0),
            )
        assert "half hour" in str(exc_info.value).lower()

    # ========== INVALID: LOGIC ==========

    def test_reject_end_before_start(self):
        """Invalid: End time before start time"""
        with pytest.raises(ValidationError) as exc_info:
            TimeRange(
                start_time=datetime(2025, 10, 15, 11, 0, 0),
                end_time=datetime(2025, 10, 15, 10, 0, 0),
            )
        assert "after start_time" in str(exc_info.value).lower()

    def test_reject_end_equals_start(self):
        """Invalid: End time equals start time"""
        with pytest.raises(ValidationError) as exc_info:
            TimeRange(
                start_time=datetime(2025, 10, 15, 10, 0, 0),
                end_time=datetime(2025, 10, 15, 10, 0, 0),
            )
        assert "after start_time" in str(exc_info.value).lower()

    # ========== EDGE CASES ==========

    def test_valid_across_midnight(self):
        """Valid: Time range crossing midnight"""
        tr = TimeRange(
            start_time=datetime(2025, 10, 15, 23, 30, 0),
            end_time=datetime(2025, 10, 16, 0, 30, 0),
        )
        assert tr.start_time.day == 15
        assert tr.end_time.day == 16

    def test_valid_exactly_30_minutes_on_half_hour(self):
        """Valid: Exactly 30 minutes starting on :30"""
        tr = TimeRange(
            start_time=datetime(2025, 10, 15, 10, 30, 0),
            end_time=datetime(2025, 10, 15, 11, 0, 0),
        )
        assert (tr.end_time - tr.start_time) == timedelta(minutes=30)
