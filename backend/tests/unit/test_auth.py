from unittest.mock import AsyncMock, patch

import firebase_admin.auth
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.middleware.auth import has_roles
from app.middleware.auth_middleware import AuthMiddleware
from app.schemas.user import UserRole

# To test: public paths, protected routes, missing token, invalid token,
# revoked token, expired token
# also test routes w/ different permissions? (e.g. admin, user, etc.)

# Create a test FastAPI app and apply AuthMiddleware
app = FastAPI()
app.add_middleware(AuthMiddleware, public_paths=["/public"])


@app.get("/public")
async def public_route():
    return {"message": "This is a public route"}


@app.get("/protected")
async def protected_route():
    return {"message": "This is a protected route"}


# make one for admin, volunteer, participant


@app.get("/admin")
async def admin_route(authorized: bool = has_roles([UserRole.ADMIN])):
    return {"message": "This is an admin-only route"}


@app.get("/volunteer")
async def volunteer_route(authorized: bool = has_roles([UserRole.VOLUNTEER])):
    return {"message": "This is a volunteer-only route"}


@app.get("/participant")
async def participant_route(authorized: bool = has_roles([UserRole.PARTICIPANT])):
    return {"message": "This is a participant-only route"}


client = TestClient(app)


@pytest.fixture
def mock_firebase():  # makes mock objects to get mock responses - get sample token
    """Fixture to mock Firebase authentication methods."""
    with (
        patch("firebase_admin.auth.verify_id_token") as mock_verify,
        patch("firebase_admin.auth.get_user") as mock_get_user,
    ):
        mock_verify.return_value = {
            "uid": "test_user",
            "email": "test@example.com",
            "name": "Test User",
            "picture": "https://example.com/picture.jpg",
            "claims": {"role": "admin"},
        }

        mock_get_user.return_value = AsyncMock(email_verified=True)

        yield mock_verify, mock_get_user


@pytest.fixture
def mock_firebase_admin():
    with (
        patch("firebase_admin.auth.verify_id_token") as mock_verify,
        patch("firebase_admin.auth.get_user") as mock_get_user,
    ):
        mock_verify.return_value = {
            "uid": "test_user",
            "email": "test@example.com",
            "name": "Test User",
            "picture": "https://example.com/picture.jpg",
            "claims": {"role": "admin"},
        }

        mock_get_user.return_value = AsyncMock(email_verified=True)

        yield mock_verify, mock_get_user


@pytest.fixture
def mock_firebase_volunteer():
    with (
        patch("firebase_admin.auth.verify_id_token") as mock_verify,
        patch("firebase_admin.auth.get_user") as mock_get_user,
    ):
        mock_verify.return_value = {
            "uid": "test_user",
            "email": "test@example.com",
            "name": "Test User",
            "picture": "https://example.com/picture.jpg",
            "claims": {"role": "volunteer"},
        }

        mock_get_user.return_value = AsyncMock(email_verified=True)

        yield mock_verify, mock_get_user


@pytest.fixture
def mock_firebase_participant():
    with (
        patch("firebase_admin.auth.verify_id_token") as mock_verify,
        patch("firebase_admin.auth.get_user") as mock_get_user,
    ):
        mock_verify.return_value = {
            "uid": "test_user",
            "email": "test@example.com",
            "name": "Test User",
            "picture": "https://example.com/picture.jpg",
            "claims": {"role": "participant"},
        }

        mock_get_user.return_value = AsyncMock(email_verified=True)

        yield mock_verify, mock_get_user


def test_public_route():
    """Public routes should be accessible without authentication."""
    response = client.get("/public")
    assert response.status_code == 200  # successful
    assert response.json() == {"message": "This is a public route"}


def test_protected_route_access_granted(mock_firebase):
    # mock firebase specifies for admin rn
    """Authenticated users with a valid token should be granted access."""
    headers = {"Authorization": "Bearer valid_token"}
    response = client.get("/protected", headers=headers)

    assert response.status_code == 200
    assert response.json() == {"message": "This is a protected route"}
    assert "X-Auth-User-ID" in response.headers


def test_protected_route_participant_admin(mock_firebase_admin):
    headers = {"Authorization": "Bearer valid_token"}
    response = client.get("/admin", headers=headers)
    assert response.status_code == 403


def test_protected_route_volunteer_admin(mock_firebase_volunteer):
    headers = {"Authorization": "Bearer valid_token"}
    response = client.get("/admin", headers=headers)
    assert response.status_code == 403


def test_protected_route_missing_token():
    """Requests without an authentication token should be denied."""
    response = client.get("/protected")

    assert response.status_code == 401
    assert response.json()["detail"] == "Authentication required"


def test_protected_route_invalid_token():
    """Requests with an invalid authentication token should be denied."""
    with patch("firebase_admin.auth.verify_id_token", side_effect=Exception("Invalid Token")):
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/protected", headers=headers)

        assert response.status_code == 401
        assert "Authentication failed: Invalid Token" in response.json()["detail"]


def test_protected_route_revoked_token():
    """Requests with a revoked token should be denied."""
    with patch(
        "firebase_admin.auth.verify_id_token",
        side_effect=firebase_admin.auth.RevokedIdTokenError(message="Token revoked"),
    ):
        headers = {"Authorization": "Bearer revoked_token"}
        response = client.get("/protected", headers=headers)
        print(response.json())

        assert response.status_code == 401
        assert "Token has been revoked. Please reauthenticate." in response.json()["detail"]


def test_protected_route_expired_token():
    """Requests with an expired token should be denied."""
    with patch(
        "firebase_admin.auth.verify_id_token",
        side_effect=firebase_admin.auth.ExpiredIdTokenError(message="Token expired", cause="test"),
    ):
        headers = {"Authorization": "Bearer expired_token"}
        response = client.get("/protected", headers=headers)
        print(response.json())

        assert response.status_code == 401
        assert "Token has expired. Please reauthenticate." in response.json()["detail"]
