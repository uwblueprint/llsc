from contextlib import contextmanager
from dataclasses import dataclass
from types import SimpleNamespace
from typing import List

import firebase_admin.auth
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.sql.elements import BinaryExpression, BooleanClauseList

from app.models import Experience, Treatment
from app.server import app
from app.utilities.db_utils import get_db
from app.utilities.service_utils import get_auth_service

# TODO: ADD MORE TESTS (testing for this is super mimimal at the moment)


@pytest.fixture
def client():
    """Create test client for FastAPI app"""
    return TestClient(app)


@pytest.fixture(autouse=True)
def mock_firebase_auth(monkeypatch):
    def _verify_id_token(token, check_revoked=True):
        return {"uid": "test-user", "email": "test@example.com"}

    def _get_user(uid):
        return SimpleNamespace(email_verified=True)

    monkeypatch.setattr(firebase_admin.auth, "verify_id_token", _verify_id_token)
    monkeypatch.setattr(firebase_admin.auth, "get_user", _get_user)


class TestIntakeAPI:
    """Basic API endpoint tests"""

    def test_unauthenticated_request_returns_401(self, client):
        """Test that unauthenticated requests return 401"""
        form_data = {
            "answers": {
                "formType": "participant",
                "hasBloodCancer": "yes",
                "personalInfo": {
                    "firstName": "Test",
                    "lastName": "User",
                    "dateOfBirth": "01/01/1990",
                    "phoneNumber": "555-1234",
                    "city": "Test City",
                    "province": "Test Province",
                    "postalCode": "T1T 1T1",
                },
            }
        }

        response = client.post("/intake/submissions", json=form_data)
        assert response.status_code == 401

    def test_malformed_json_returns_401_due_to_auth_first(self, client):
        """Test that malformed JSON returns 401 because auth happens before JSON parsing"""
        response = client.post(
            "/intake/submissions", content="{ invalid json", headers={"Content-Type": "application/json"}
        )

        # Auth happens before JSON parsing, so we get 401, not 422
        assert response.status_code == 401

    def test_intake_endpoint_exists(self, client):
        """Test that the intake endpoint exists and responds"""
        # Empty request should still hit the endpoint (not 404)
        response = client.post("/intake/submissions")

        # Should not be 404 (endpoint exists)
        assert response.status_code != 404

    """GET intake/options tests"""


@dataclass
class FakeExperienceRecord:
    id: int
    name: str
    scope: str


@dataclass
class FakeTreatmentRecord:
    id: int
    name: str


def _extract_filter_values(condition) -> List[str]:
    if isinstance(condition, BooleanClauseList):
        values: List[str] = []
        for clause in condition.clauses:
            values.extend(_extract_filter_values(clause))
        return values
    if isinstance(condition, BinaryExpression):
        right = getattr(condition, "right", None)
        value = getattr(right, "value", None) if right is not None else None
        return [value] if value is not None else []
    return []


class FakeQuery:
    def __init__(self, data: List):
        self._data = list(data)

    def _clone(self, data: List):
        return self.__class__(data)

    def order_by(self, clause):
        element = getattr(clause, "element", None)
        key_name = getattr(element, "key", None) if element is not None else None
        if not key_name:
            key_name = getattr(clause, "key", None) or "id"
        sorted_data = sorted(self._data, key=lambda item: getattr(item, key_name))
        return self._clone(sorted_data)

    def all(self):
        return list(self._data)


class FakeExperienceQuery(FakeQuery):
    def filter(self, condition):
        scopes = {value for value in _extract_filter_values(condition) if value is not None}
        if not scopes:
            return self._clone(self._data)
        filtered = [item for item in self._data if item.scope in scopes]
        return self._clone(filtered)


class FakeTreatmentQuery(FakeQuery):
    pass


class FakeSession:
    def __init__(
        self,
        experiences: List[FakeExperienceRecord],
        treatments: List[FakeTreatmentRecord],
        query_exception: Exception | None = None,
    ):
        self._experiences = experiences
        self._treatments = treatments
        self._query_exception = query_exception

    def query(self, model):
        if self._query_exception:
            raise self._query_exception
        if model is Experience:
            return FakeExperienceQuery(self._experiences)
        if model is Treatment:
            return FakeTreatmentQuery(self._treatments)
        raise AssertionError(f"Unexpected model queried: {model}")

    def close(self):
        """Mimic SQLAlchemy session close."""


@contextmanager
def override_dependencies(session: FakeSession, authorized: bool = True):
    def _override_db():
        yield session

    class DummyAuthService:
        def is_authorized_by_role(self, token, roles):
            return authorized

    app.dependency_overrides[get_db] = _override_db
    app.dependency_overrides[get_auth_service] = lambda: DummyAuthService()

    try:
        yield
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(get_auth_service, None)
        if hasattr(session, "close"):
            session.close()


class TestGetIntakeOptions:
    auth_header = {"Authorization": "Bearer test-token"}

    def test_patient_target_filters_and_sorts_experiences(self, client):
        experiences = [
            FakeExperienceRecord(id=2, name="Caregiver Only", scope="caregiver"),
            FakeExperienceRecord(id=3, name="Both Eligible", scope="both"),
            FakeExperienceRecord(id=1, name="Patient Only", scope="patient"),
        ]
        treatments = [
            FakeTreatmentRecord(id=2, name="Radiation"),
            FakeTreatmentRecord(id=1, name="Chemotherapy"),
        ]
        session = FakeSession(experiences, treatments)

        with override_dependencies(session):
            response = client.get("/intake/options", params={"target": "patient"}, headers=self.auth_header)

        assert response.status_code == 200
        body = response.json()
        experience_scopes = [exp["scope"] for exp in body["experiences"]]
        experience_ids = [exp["id"] for exp in body["experiences"]]
        assert experience_scopes == ["patient", "both"], "Only patient & both scopes should be returned"
        assert experience_ids == [1, 3], "Experiences should be ordered by id ascending"
        treatment_ids = [treatment["id"] for treatment in body["treatments"]]
        assert treatment_ids == [1, 2], "Treatments should be ordered by id ascending"

    def test_caregiver_target_includes_both_scope(self, client):
        experiences = [
            FakeExperienceRecord(id=1, name="Patient Experience", scope="patient"),
            FakeExperienceRecord(id=2, name="Caregiver Experience", scope="caregiver"),
            FakeExperienceRecord(id=3, name="Shared Experience", scope="both"),
        ]
        treatments = [FakeTreatmentRecord(id=1, name="Chemotherapy")]
        session = FakeSession(experiences, treatments)

        with override_dependencies(session):
            response = client.get("/intake/options", params={"target": "caregiver"}, headers=self.auth_header)

        assert response.status_code == 200
        body = response.json()
        returned_scopes = {exp["scope"] for exp in body["experiences"]}
        assert returned_scopes == {"caregiver", "both"}
        assert all(exp["id"] in {2, 3} for exp in body["experiences"])

    def test_both_target_returns_all_experiences(self, client):
        experiences = [
            FakeExperienceRecord(id=1, name="Patient Experience", scope="patient"),
            FakeExperienceRecord(id=2, name="Caregiver Experience", scope="caregiver"),
            FakeExperienceRecord(id=3, name="Shared Experience", scope="both"),
        ]
        treatments = [FakeTreatmentRecord(id=1, name="Chemotherapy")]
        session = FakeSession(experiences, treatments)

        with override_dependencies(session):
            response = client.get("/intake/options", params={"target": "both"}, headers=self.auth_header)

        assert response.status_code == 200
        body = response.json()
        assert [exp["id"] for exp in body["experiences"]] == [1, 2, 3]
        assert [exp["scope"] for exp in body["experiences"]] == ["patient", "caregiver", "both"]

    def test_missing_authorization_header_returns_403(self, client):
        response = client.get("/intake/options", params={"target": "patient"})
        assert response.status_code == 401

    def test_invalid_target_returns_422(self, client):
        session = FakeSession([], [])

        with override_dependencies(session):
            response = client.get(
                "/intake/options",
                params={"target": "invalid"},
                headers=self.auth_header,
            )
        assert response.status_code == 422

    def test_database_error_returns_500(self, client):
        session = FakeSession([], [], query_exception=RuntimeError("database down"))

        with override_dependencies(session):
            response = client.get("/intake/options", params={"target": "patient"}, headers=self.auth_header)

        assert response.status_code == 500
        assert response.json()["detail"] == "database down"
