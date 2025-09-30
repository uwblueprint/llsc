import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.middleware.auth_middleware import AuthMiddleware


from app.models import Base
from app.server import app
from app.utilities.db_utils import get_db

# Use in-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite://"

@pytest.fixture(scope="session")
def test_engine():
    """Create a test database engine"""
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    return engine

@pytest.fixture(scope="function")
def db_session(test_engine):
    """Create a fresh database session for each test"""
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.rollback()
        db.close()

@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with a test database"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def auth_headers():
    """Mock authentication headers for testing"""
    # This is a mock token - in real tests you might want to use a real Firebase token
    return {"Authorization": "Bearer test-token"}

@pytest.fixture(scope="function")
def mock_auth_middleware(monkeypatch):
    """Mock the auth middleware to bypass Firebase authentication"""

    async def mock_dispatch(self, request, call_next):
        # Mock user data that would normally come from Firebase
        request.state.user_id = "test-user-id"
        request.state.user_email = "test@example.com"
        request.state.email_verified = True
        request.state.user_claims = {"admin": True}
        return await call_next(request)

    monkeypatch.setattr(AuthMiddleware, "dispatch", mock_dispatch)
