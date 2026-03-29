from unittest.mock import MagicMock

import pytest

from app.utilities.user_name import resolve_user_first_name


def _make_user(first_name=None, user_data_first_name=None):
    user = MagicMock()
    user.first_name = first_name

    if user_data_first_name is not None:
        user.user_data = MagicMock()
        user.user_data.first_name = user_data_first_name
    else:
        user.user_data = None

    return user


class TestResolveUserFirstName:
    def test_returns_none_for_none_user(self):
        assert resolve_user_first_name(None) is None

    def test_returns_user_first_name(self):
        user = _make_user(first_name="Yash")
        assert resolve_user_first_name(user) == "Yash"

    def test_strips_user_first_name(self):
        user = _make_user(first_name="  Yash  ")
        assert resolve_user_first_name(user) == "Yash"

    def test_falls_back_to_user_data_first_name(self):
        user = _make_user(first_name=None, user_data_first_name="Marie")
        assert resolve_user_first_name(user) == "Marie"

    def test_falls_back_when_user_first_name_is_empty(self):
        user = _make_user(first_name="", user_data_first_name="Marie")
        assert resolve_user_first_name(user) == "Marie"

    def test_falls_back_when_user_first_name_is_whitespace(self):
        user = _make_user(first_name="   ", user_data_first_name="Marie")
        assert resolve_user_first_name(user) == "Marie"

    def test_strips_user_data_first_name(self):
        user = _make_user(first_name=None, user_data_first_name="  Marie  ")
        assert resolve_user_first_name(user) == "Marie"

    def test_returns_none_when_both_empty(self):
        user = _make_user(first_name="", user_data_first_name="")
        assert resolve_user_first_name(user) is None

    def test_returns_none_when_both_whitespace(self):
        user = _make_user(first_name="   ", user_data_first_name="   ")
        assert resolve_user_first_name(user) is None

    def test_returns_none_when_both_none(self):
        user = _make_user(first_name=None, user_data_first_name=None)
        assert resolve_user_first_name(user) is None

    def test_returns_none_when_no_user_data_relation(self):
        user = _make_user(first_name=None)
        assert resolve_user_first_name(user) is None

    def test_prefers_user_first_name_over_user_data(self):
        user = _make_user(first_name="Yash", user_data_first_name="Marie")
        assert resolve_user_first_name(user) == "Yash"
