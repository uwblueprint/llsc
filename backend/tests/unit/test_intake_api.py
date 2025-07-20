import pytest
from fastapi.testclient import TestClient

from app.server import app

# TODO: ADD MORE TESTS (testing for this is super mimimal at the moment)


@pytest.fixture
def client():
    """Create test client for FastAPI app"""
    return TestClient(app)


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
