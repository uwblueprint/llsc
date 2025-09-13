import os
from typing import List

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, sessionmaker

from app.models import Experience, Quality, Role, Treatment, User, UserData
from app.schemas.user import UserRole
from app.services.implementations.ranking_service import RankingService

# Postgres-only configuration (migrations assumed to be applied)
POSTGRES_DATABASE_URL = os.getenv("POSTGRES_TEST_DATABASE_URL")
if not POSTGRES_DATABASE_URL:
    raise RuntimeError(
        "POSTGRES_DATABASE_URL is not set. Please export a Postgres URL, e.g. "
        "postgresql+psycopg2://postgres:postgres@db:5432/llsc_test"
    )
engine = create_engine(POSTGRES_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session() -> Session:
    session = TestingSessionLocal()
    try:
        # FK-safe cleanup of related tables used in this test module
        session.execute(
            text(
                "TRUNCATE TABLE ranking_preferences, user_loved_one_experiences, user_loved_one_treatments, "
                "user_experiences, user_treatments, user_data, users RESTART IDENTITY CASCADE"
            )
        )
        session.commit()

        # Ensure roles exist
        existing = {r.id for r in session.query(Role).all()}
        roles = [
            Role(id=1, name=UserRole.PARTICIPANT),
            Role(id=2, name=UserRole.VOLUNTEER),
            Role(id=3, name=UserRole.ADMIN),
        ]
        for r in roles:
            if r.id not in existing:
                session.add(r)
        session.commit()

        # Qualities should be seeded by CI before tests run
        assert session.query(Quality).count() >= 6

        # Ensure sequences are aligned after seeding (avoid PK collisions when inserting)
        session.execute(
            text(
                "SELECT setval(pg_get_serial_sequence('treatments','id'), COALESCE((SELECT MAX(id) FROM treatments), 0))"
            )
        )
        session.execute(
            text(
                "SELECT setval(pg_get_serial_sequence('experiences','id'), COALESCE((SELECT MAX(id) FROM experiences), 0))"
            )
        )
        session.commit()

        yield session
    finally:
        session.rollback()
        session.close()


def _add_user_data(
    session: Session,
    *,
    auth_id: str,
    role_id: int = 1,
    has_blood_cancer: str = "no",
    caring_for_someone: str = "no",
    diagnosis: str | None = None,
    loved_one_diagnosis: str | None = None,
    self_treatments: List[str] | None = None,
    self_experiences: List[str] | None = None,
    loved_treatments: List[str] | None = None,
    loved_experiences: List[str] | None = None,
) -> User:
    user = User(first_name="T", last_name="U", email=f"{auth_id}@ex.com", role_id=role_id, auth_id=auth_id)
    session.add(user)
    session.commit()

    data = UserData(
        user_id=user.id,
        has_blood_cancer=has_blood_cancer,
        caring_for_someone=caring_for_someone,
        diagnosis=diagnosis,
        loved_one_diagnosis=loved_one_diagnosis,
    )
    session.add(data)
    session.flush()

    def get_or_create_treatment(name: str) -> Treatment:
        t = session.query(Treatment).filter(Treatment.name == name).first()
        if t:
            return t
        for _ in range(2):
            try:
                t = Treatment(name=name)
                session.add(t)
                session.flush()
                return t
            except IntegrityError:
                session.rollback()
                # Sequence collision consumed an id; retry insert
                t = session.query(Treatment).filter(Treatment.name == name).first()
                if t:
                    return t
        # Final attempt to read existing
        return session.query(Treatment).filter(Treatment.name == name).first()

    def get_or_create_experience(name: str) -> Experience:
        e = session.query(Experience).filter(Experience.name == name).first()
        if e:
            return e
        for _ in range(2):
            try:
                e = Experience(name=name)
                session.add(e)
                session.flush()
                return e
            except IntegrityError:
                session.rollback()
                e = session.query(Experience).filter(Experience.name == name).first()
                if e:
                    return e
        return session.query(Experience).filter(Experience.name == name).first()

    for n in self_treatments or []:
        data.treatments.append(get_or_create_treatment(n))
    for n in self_experiences or []:
        data.experiences.append(get_or_create_experience(n))
    for n in loved_treatments or []:
        data.loved_one_treatments.append(get_or_create_treatment(n))
    for n in loved_experiences or []:
        data.loved_one_experiences.append(get_or_create_experience(n))

    session.commit()
    return user


@pytest.mark.asyncio
async def test_options_patient_participant_target_patient(db_session: Session):
    user = _add_user_data(
        db_session,
        auth_id="auth_patient",
        has_blood_cancer="yes",
        caring_for_someone="no",
        diagnosis="AML",
        self_treatments=["Chemotherapy"],
        self_experiences=["Fatigue"],
    )

    service = RankingService(db_session)
    res = service.get_options(user_auth_id=user.auth_id, target="patient")

    # same_diagnosis should allow self only
    same_diag = next(q for q in res["static_qualities"] if q["slug"] == "same_diagnosis")
    assert same_diag["allowed_scopes"] == ["self"]

    # dynamic should include self items
    scopes = {o["scope"] for o in res["dynamic_options"]}
    assert scopes == {"self"}


@pytest.mark.asyncio
async def test_options_caregiver_without_cancer(db_session: Session):
    user = _add_user_data(
        db_session,
        auth_id="auth_cg_no_cancer",
        has_blood_cancer="no",
        caring_for_someone="yes",
        self_treatments=["Oral Chemotherapy"],
        self_experiences=["Caregiver Fatigue"],
        loved_one_diagnosis="CLL",
        loved_treatments=["Immunotherapy"],
        loved_experiences=["Anxiety"],
    )

    service = RankingService(db_session)
    # target=patient → loved_one options only; same_diagnosis loved_one only
    res_p = service.get_options(user_auth_id=user.auth_id, target="patient")
    same_diag_p = next(q for q in res_p["static_qualities"] if q["slug"] == "same_diagnosis")
    assert same_diag_p["allowed_scopes"] == ["loved_one"]
    assert {o["scope"] for o in res_p["dynamic_options"]} == {"loved_one"}

    # target=caregiver → both scopes; same_diagnosis loved_one only
    res_c = service.get_options(user_auth_id=user.auth_id, target="caregiver")
    same_diag_c = next(q for q in res_c["static_qualities"] if q["slug"] == "same_diagnosis")
    assert same_diag_c["allowed_scopes"] == ["loved_one"]
    assert {o["scope"] for o in res_c["dynamic_options"]} == {"self", "loved_one"}


@pytest.mark.asyncio
async def test_options_caregiver_with_cancer(db_session: Session):
    user = _add_user_data(
        db_session,
        auth_id="auth_cg_with_cancer",
        has_blood_cancer="yes",
        caring_for_someone="yes",
        diagnosis="MDS",
        loved_one_diagnosis="MM",
        self_treatments=["Radiation Therapy"],
        self_experiences=["PTSD"],
        loved_treatments=["Watch and Wait / Active Surveillance"],
        loved_experiences=["Communication Challenges"],
    )

    service = RankingService(db_session)
    # target=patient → loved_one options only; same_diagnosis loved_one only
    res_p = service.get_options(user_auth_id=user.auth_id, target="patient")
    same_diag_p = next(q for q in res_p["static_qualities"] if q["slug"] == "same_diagnosis")
    assert same_diag_p["allowed_scopes"] == ["loved_one"]
    assert {o["scope"] for o in res_p["dynamic_options"]} == {"loved_one"}

    # target=caregiver → both scopes; same_diagnosis includes both scopes
    res_c = service.get_options(user_auth_id=user.auth_id, target="caregiver")
    same_diag_c = next(q for q in res_c["static_qualities"] if q["slug"] == "same_diagnosis")
    assert set(same_diag_c["allowed_scopes"]) == {"self", "loved_one"}
    assert {o["scope"] for o in res_c["dynamic_options"]} == {"self", "loved_one"}


def test_save_preferences_validation(db_session: Session):
    # Setup a participant with some options
    user = _add_user_data(
        db_session,
        auth_id="auth_validate",
        has_blood_cancer="no",
        caring_for_someone="yes",
        loved_treatments=["Immunotherapy"],
        loved_experiences=["Anxiety"],
    )
    service = RankingService(db_session)

    # More than 5 items
    too_many = [
        {"kind": "quality", "id": 1, "scope": "self", "rank": 1},
        {"kind": "quality", "id": 2, "scope": "self", "rank": 2},
        {"kind": "quality", "id": 3, "scope": "self", "rank": 3},
        {"kind": "quality", "id": 4, "scope": "self", "rank": 4},
        {"kind": "quality", "id": 5, "scope": "self", "rank": 5},
        {"kind": "quality", "id": 6, "scope": "self", "rank": 5},
    ]
    with pytest.raises(ValueError):
        service.save_preferences(user_auth_id=user.auth_id, target="patient", items=too_many)

    # Duplicate ranks
    dup_ranks = [
        {"kind": "quality", "id": 1, "scope": "self", "rank": 1},
        {"kind": "quality", "id": 2, "scope": "self", "rank": 1},
    ]
    with pytest.raises(ValueError):
        service.save_preferences(user_auth_id=user.auth_id, target="patient", items=dup_ranks)

    # Rank out of bounds
    bad_rank = [{"kind": "quality", "id": 1, "scope": "self", "rank": 6}]
    with pytest.raises(ValueError):
        service.save_preferences(user_auth_id=user.auth_id, target="patient", items=bad_rank)

    # Duplicate items
    dup_items = [
        {"kind": "quality", "id": 1, "scope": "self", "rank": 1},
        {"kind": "quality", "id": 1, "scope": "self", "rank": 2},
    ]
    with pytest.raises(ValueError):
        service.save_preferences(user_auth_id=user.auth_id, target="patient", items=dup_items)
