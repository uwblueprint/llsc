import os
from uuid import UUID

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from app.models import Role
from app.models.User import User
from app.schemas.user import (
    SignUpMethod,
    UserCreateRequest,
    UserCreateResponse,
    UserRole,
    UserUpdateRequest,
)
from app.services.implementations.user_service import UserService

# Test DB Configuration - Always require Postgres for full parity
POSTGRES_DATABASE_URL = os.getenv("POSTGRES_TEST_DATABASE_URL")
if not POSTGRES_DATABASE_URL:
    raise RuntimeError(
        "POSTGRES_DATABASE_URL is not set. Please export a Postgres URL, e.g. "
        "postgresql+psycopg2://postgres:postgres@db:5432/llsc_test"
    )
engine = create_engine(POSTGRES_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class MockFirebaseUser:
    """Mock Firebase user response"""

    def __init__(self):
        self.uid = "test_firebase_uid"
        self.email = "test@example.com"


class MockFirebaseError(Exception):
    """Mock Firebase error"""

    pass


class MockAuthError(MockFirebaseError):
    """Mock Firebase auth error"""

    def __init__(self, code, message):
        self.code = code
        self.message = message
        super().__init__(f"{code}: {message}")


@pytest.fixture
def mock_firebase_auth(monkeypatch):
    """Mock Firebase authentication service"""

    class MockAuth:
        def create_user(self, email, password):
            return MockFirebaseUser()

        def get_user(self, uid):
            return MockFirebaseUser()

        def delete_user(self, uid):
            pass

        AuthError = MockAuthError

    mock_auth = MockAuth()
    monkeypatch.setattr("firebase_admin.auth", mock_auth)
    return mock_auth


@pytest.fixture(scope="function")
def db_session():
    """Provide a clean database session for each test (Postgres only).

    Assumes Alembic migrations have run. Seeds roles if missing.
    """

    session = TestingSessionLocal()

    try:
        # Clean up any existing data first (ensure no FK violations)
        session.execute(
            text(
                "TRUNCATE TABLE form_submissions, user_loved_one_experiences, user_loved_one_treatments, "
                "user_experiences, user_treatments, available_times, matches, suggested_times, user_data, users "
                "RESTART IDENTITY CASCADE"
            )
        )
        session.commit()

        # Ensure roles exist (id 1..3)
        existing = {r.id for r in session.query(Role).all()}
        seed_roles = [
            Role(id=1, name=UserRole.PARTICIPANT),
            Role(id=2, name=UserRole.VOLUNTEER),
            Role(id=3, name=UserRole.ADMIN),
        ]
        for role in seed_roles:
            if role.id not in existing:
                try:
                    session.add(role)
                    session.commit()
                except IntegrityError:
                    session.rollback()

        yield session
    finally:
        session.rollback()
        session.close()
        # No DDL teardown for Postgres; database persists across tests


@pytest.mark.asyncio
async def test_create_user_service(mock_firebase_auth, db_session):
    """Test user creation flow including Firebase auth and database storage"""
    try:
        # Arrange
        user_service = UserService(db_session)
        user_data = UserCreateRequest(
            first_name="Test",
            last_name="User",
            email="test@example.com",
            password="TestPass@123",
            role=UserRole.PARTICIPANT,
            signup_method=SignUpMethod.PASSWORD,
        )

        # Act
        created_user = await user_service.create_user(user_data)

        # Assert response
        assert isinstance(created_user, UserCreateResponse)
        assert created_user.first_name == "Test"
        assert created_user.last_name == "User"
        assert created_user.email == "test@example.com"
        assert created_user.role_id == 1
        assert created_user.auth_id == "test_firebase_uid"

        # Assert database state
        db_user = db_session.query(User).filter_by(email="test@example.com").first()
        assert db_user is not None
        assert db_user.auth_id == "test_firebase_uid"
        assert db_user.role_id == 1

        db_session.commit()  # Commit successful test
    except Exception:
        db_session.rollback()  # Rollback on error
        raise


@pytest.mark.asyncio
async def test_create_user_with_google(mock_firebase_auth, db_session):
    """Test user creation flow with Google authentication"""
    try:
        # Arrange
        user_service = UserService(db_session)
        user_data = UserCreateRequest(
            first_name="Google",
            last_name="User",
            email="google@example.com",
            role=UserRole.PARTICIPANT,
            signup_method=SignUpMethod.GOOGLE,
        )

        # Act
        created_user = await user_service.create_user(user_data)

        # Assert response
        assert isinstance(created_user, UserCreateResponse)
        assert created_user.first_name == "Google"
        assert created_user.last_name == "User"
        assert created_user.email == "google@example.com"
        assert created_user.role_id == 1
        assert created_user.auth_id == "test_firebase_uid"

        # Assert database state
        db_user = db_session.query(User).filter_by(email="google@example.com").first()
        assert db_user is not None
        assert db_user.auth_id == "test_firebase_uid"
        assert db_user.role_id == 1

        db_session.commit()  # Commit successful test
    except Exception:
        db_session.rollback()  # Rollback on error
        raise


@pytest.mark.asyncio
async def test_delete_user_by_email(db_session):
    """Test deleting a user by email"""
    try:
        # Arrange
        user_service = UserService(db_session)
        test_user = User(
            first_name="Test",
            last_name="User",
            email="delete@example.com",
            role_id=1,
            auth_id="test_auth_id",
        )
        db_session.add(test_user)
        db_session.commit()

        # Act
        await user_service.delete_user_by_email("delete@example.com")

        # Assert
        deleted_user = db_session.query(User).filter_by(email="delete@example.com").first()
        assert deleted_user is None

    except Exception:
        db_session.rollback()
        raise


@pytest.mark.asyncio
async def test_delete_user_by_id(db_session):
    """Test deleting a user by ID"""
    try:
        # Arrange
        user_service = UserService(db_session)
        test_user = User(
            first_name="Test",
            last_name="User",
            email="delete_id@example.com",
            role_id=1,
            auth_id="test_auth_id",
        )
        db_session.add(test_user)
        db_session.commit()
        user_id = str(test_user.id)

        # Act
        await user_service.delete_user_by_id(user_id)

        # Assert
        deleted_user = db_session.query(User).filter_by(id=test_user.id).first()
        assert deleted_user is None

    except Exception:
        db_session.rollback()
        raise


@pytest.mark.asyncio
async def test_get_user_id_by_auth_id(db_session):
    """Test getting user ID by auth ID"""
    try:
        # Arrange
        user_service = UserService(db_session)
        test_user = User(
            first_name="Test",
            last_name="User",
            email="auth_id@example.com",
            role_id=1,
            auth_id="test_auth_id",
        )
        db_session.add(test_user)
        db_session.commit()

        # Act
        user_id = await user_service.get_user_id_by_auth_id("test_auth_id")

        # Assert
        assert user_id == str(test_user.id)

    except Exception:
        db_session.rollback()
        raise


def test_get_user_by_email(db_session):
    """Test getting user by email"""
    try:
        # Arrange
        user_service = UserService(db_session)
        test_user = User(
            first_name="Test",
            last_name="User",
            email="email@example.com",
            role_id=1,
            auth_id="test_auth_id",
        )
        db_session.add(test_user)
        db_session.commit()

        # Act
        user = user_service.get_user_by_email("email@example.com")

        # Assert
        assert user.email == "email@example.com"
        assert user.first_name == "Test"
        assert user.last_name == "User"

    except Exception:
        db_session.rollback()
        raise


@pytest.mark.asyncio
async def test_get_user_by_id(db_session):
    """Test getting user by ID"""
    try:
        # Arrange
        user_service = UserService(db_session)
        test_user = User(
            first_name="Test",
            last_name="User",
            email="id@example.com",
            role_id=1,  # PARTICIPANT role
            auth_id="test_auth_id",
        )
        db_session.add(test_user)
        db_session.commit()

        # Act
        user = await user_service.get_user_by_id(str(test_user.id))

        # Assert
        assert user.email == "id@example.com"
        assert user.first_name == "Test"
        assert user.last_name == "User"
        assert user.role.name == "participant"  # Compare role name string

    except Exception:
        db_session.rollback()
        raise


def test_get_auth_id_by_user_id(db_session):
    """Test getting auth ID by user ID"""
    try:
        # Arrange
        user_service = UserService(db_session)
        test_user = User(
            first_name="Test",
            last_name="User",
            email="auth@example.com",
            role_id=1,
            auth_id="test_auth_id",
        )
        db_session.add(test_user)
        db_session.commit()

        # Act
        auth_id = user_service.get_auth_id_by_user_id(
            test_user.id  # Pass UUID object directly
        )

        # Assert
        assert auth_id == "test_auth_id"

    except Exception:
        db_session.rollback()
        raise


def test_get_user_role_by_auth_id(db_session):
    """Test getting user role by auth ID"""
    try:
        # Arrange
        user_service = UserService(db_session)
        test_user = User(
            first_name="Test",
            last_name="User",
            email="role@example.com",
            role_id=1,  # PARTICIPANT role
            auth_id="test_auth_id",
        )
        db_session.add(test_user)
        db_session.commit()

        # Act
        role = user_service.get_user_role_by_auth_id("test_auth_id")

        # Assert
        assert role == UserRole.PARTICIPANT

        # Verify database state
        db_user = db_session.query(User).join(Role).filter(User.auth_id == "test_auth_id").first()
        assert db_user.role.name == UserRole.PARTICIPANT

    except Exception:
        db_session.rollback()
        raise


@pytest.mark.asyncio
async def test_get_users(db_session):
    """Test getting all users"""
    try:
        # Arrange
        user_service = UserService(db_session)
        test_users = [
            User(
                first_name=f"Test{i}",
                last_name=f"User{i}",
                email=f"user{i}@example.com",
                # Alternate between PARTICIPANT (1) and VOLUNTEER (2)
                role_id=1 if i % 2 == 0 else 2,
                auth_id=f"test_auth_id_{i}",
            )
            for i in range(4)  # Create 4 users
        ]
        # Add one admin user
        admin_user = User(
            first_name="Admin",
            last_name="User",
            email="admin@example.com",
            role_id=3,  # ADMIN role
            auth_id="admin_auth_id",
        )
        test_users.append(admin_user)

        for user in test_users:
            db_session.add(user)
        db_session.commit()

        # Act - Get non-admin users (default behavior)
        users = await user_service.get_users()

        # Assert
        assert len(users) == 4  # Should only get PARTICIPANT and VOLUNTEER users
        for user in users:
            assert user.role.name in ["participant", "volunteer"]  # Non-admin roles
            assert user.role.name != "admin"  # Should not include admin users

        # Verify we have both participant and volunteer users
        role_names = [user.role.name for user in users]
        assert "participant" in role_names
        assert "volunteer" in role_names

    except Exception:
        db_session.rollback()
        raise


@pytest.mark.asyncio
async def test_get_admins(db_session):
    """Test getting admin users only"""
    try:
        # Arrange
        user_service = UserService(db_session)
        # Create some non-admin users
        test_users = [
            User(
                first_name=f"Test{i}",
                last_name=f"User{i}",
                email=f"user{i}@example.com",
                role_id=1 if i % 2 == 0 else 2,
                auth_id=f"test_auth_id_{i}",
            )
            for i in range(4)  # Create 4 non-admin users
        ]
        # Add two admin users
        admin_users = [
            User(
                first_name=f"Admin{i}",
                last_name=f"User{i}",
                email=f"admin{i}@example.com",
                role_id=3,  # ADMIN role
                auth_id=f"admin_auth_id_{i}",
            )
            for i in range(2)  # Create 2 admin users
        ]
        test_users.extend(admin_users)

        for user in test_users:
            db_session.add(user)
        db_session.commit()

        # Act
        users = await user_service.get_admins()

        # Assert
        assert len(users) == 2  # Should only get admin users
        for user in users:
            assert user.role.name == "admin"  # Should only be admin role
            assert user.email.startswith("admin")  # Verify admin emails

        # Verify we have both admin users
        admin_emails = [user.email for user in users]
        assert "admin0@example.com" in admin_emails
        assert "admin1@example.com" in admin_emails

    except Exception:
        db_session.rollback()
        raise


@pytest.mark.asyncio
async def test_update_user_by_id(db_session):
    """Test updating user by ID"""
    try:
        # Arrange
        user_service = UserService(db_session)
        test_user = User(
            first_name="Test",
            last_name="User",
            email="update@example.com",
            role_id=1,  # PARTICIPANT role
            auth_id="test_auth_id",
        )
        db_session.add(test_user)
        db_session.commit()

        # Act
        updated_user = await user_service.update_user_by_id(
            str(test_user.id),
            UserUpdateRequest(
                first_name="Updated",
                last_name="Name",
                role=UserRole.ADMIN,  # Update to ADMIN role
            ),
        )

        # Assert
        assert updated_user.first_name == "Updated"
        assert updated_user.last_name == "Name"
        assert updated_user.role.name == "admin"  # Compare role name string
        assert updated_user.email == "update@example.com"  # Unchanged

        # Verify database state
        db_user = db_session.query(User).filter_by(id=test_user.id).first()
        assert db_user.role_id == 3  # ADMIN role ID

    except Exception:
        db_session.rollback()
        raise

# Error case tests
@pytest.mark.asyncio
async def test_delete_nonexistent_user_by_email(db_session):
    """Test deleting a non-existent user"""
    user_service = UserService(db_session)
    with pytest.raises(HTTPException) as exc_info:
        await user_service.delete_user_by_email("nonexistent@example.com")
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_delete_nonexistent_user_by_id(db_session):
    """Test deleting a non-existent user"""
    user_service = UserService(db_session)
    with pytest.raises(HTTPException) as exc_info:
        await user_service.delete_user_by_id("00000000-0000-0000-0000-000000000000")
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_get_nonexistent_user_by_id(db_session):
    """Test getting a non-existent user by ID"""
    user_service = UserService(db_session)
    with pytest.raises(HTTPException) as exc_info:
        await user_service.get_user_by_id("00000000-0000-0000-0000-000000000000")
    assert exc_info.value.status_code == 404


def test_get_nonexistent_user_by_email(db_session):
    """Test getting user by email"""
    user_service = UserService(db_session)
    with pytest.raises(ValueError) as exc_info:
        user_service.get_user_by_email("nonexistent@example.com")
    assert "not found" in str(exc_info.value)


def test_get_nonexistent_auth_id_by_user_id(db_session):
    """Test getting auth ID for non-existent user"""
    user_service = UserService(db_session)
    with pytest.raises(ValueError) as exc_info:
        user_service.get_auth_id_by_user_id(
            UUID("00000000-0000-0000-0000-000000000000")  # Pass UUID object
        )
    assert "not found" in str(exc_info.value)


def test_get_nonexistent_user_role_by_auth_id(db_session):
    """Test getting role for non-existent user"""
    user_service = UserService(db_session)
    with pytest.raises(ValueError) as exc_info:
        user_service.get_user_role_by_auth_id("nonexistent_auth_id")
    assert "not found" in str(exc_info.value)


@pytest.mark.asyncio
async def test_update_nonexistent_user(db_session):
    """Test updating a non-existent user"""
    user_service = UserService(db_session)
    with pytest.raises(HTTPException) as exc_info:
        await user_service.update_user_by_id(
            "00000000-0000-0000-0000-000000000000",
            UserUpdateRequest(first_name="Updated"),
        )
    assert exc_info.value.status_code == 404
