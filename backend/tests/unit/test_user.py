import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models import Role
from app.models.Base import Base
from app.models.User import User
from app.schemas.user import UserCreate, UserInDB, UserRole
from app.services.implementations.user_service import UserService

# Test DB Configuration
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
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

        def get_user_by_email(self, email):
            return MockFirebaseUser()

        def delete_user(self, uid):
            pass

        AuthError = MockAuthError

    mock_auth = MockAuth()
    monkeypatch.setattr("firebase_admin.auth", mock_auth)
    return mock_auth


@pytest.fixture(scope="function")
def db_session():
    """Provide a clean database session for each test"""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()

    try:
        # Clean up any existing data first
        session.query(User).delete()
        session.query(Role).delete()
        session.commit()

        # Create test role
        test_role = Role(id=1, name=UserRole.PARTICIPANT)
        session.add(test_role)
        session.commit()

        yield session
    finally:
        session.rollback()
        session.close()
        # Clean up
        session = TestingSessionLocal()
        session.query(User).delete()
        session.query(Role).delete()
        session.commit()
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.mark.asyncio
async def test_create_user_service(mock_firebase_auth, db_session):
    """Test user creation flow including Firebase auth and database storage"""
    try:
        # Arrange
        user_service = UserService(db_session)
        user_data = UserCreate(
            first_name="Test",
            last_name="User",
            email="test@example.com",
            password="TestPass@123",
            role=UserRole.PARTICIPANT,
        )

        # Act
        created_user = await user_service.create_user(user_data)

        # Assert response
        assert isinstance(created_user, UserInDB)
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
