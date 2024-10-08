import pytest

# from app.models import db
# from app.models.user import User
# from app.services.implementations.user_service import UserService

"""
Sample python test.
For more information on pytest, visit:
https://docs.pytest.org/en/6.2.x/reference.html

TODO: refactor code based on base SQLAlchemy and implementations
"""


@pytest.fixture(scope="module", autouse=True)
def setup(module_mocker):
    module_mocker.patch(
        "app.services.implementations.auth_service.AuthService.is_authorized_by_role",
        return_value=True,
    )
    module_mocker.patch("firebase_admin.auth.get_user", return_value=FirebaseUser())


# TODO: re-enable when functionality has been added
# @pytest.fixture
# def user_service():
#     user_service = UserService(current_app.logger)
#     yield user_service
#     User.query.delete()


TEST_USERS = (
    {
        "auth_id": "A",
        "first_name": "Jane",
        "last_name": "Doe",
        "role": "Admin",
    },
    {
        "auth_id": "B",
        "first_name": "Hello",
        "last_name": "World",
        "role": "User",
    },
)


class FirebaseUser:
    """
    Mock returned firebase user
    """

    def __init__(self):
        self.email = "test@test.com"


def get_expected_user(user):
    """
    Remove auth_id field from user and sets email field.
    """
    expected_user = user.copy()
    expected_user["email"] = "test@test.com"
    expected_user.pop("auth_id", None)
    return expected_user


# TODO: re-enable when functionality has been added
# def insert_users():
#     user_instances = [User(**data) for data in TEST_USERS]
#     db.session.bulk_save_objects(user_instances)
#     db.session.commit()


def assert_returned_users(users, expected):
    for expected_user, actual_user in zip(expected, users):
        for key in expected[0].keys():
            assert expected_user[key] == actual_user[key]


# TODO: re-enable when functionality has been added
# def test_get_users(user_service):
#     insert_users()
#     res = user_service.get_users()
#     users = list(map(lambda user: user.__dict__, res))
#     users_with_email = list(map(get_expected_user, TEST_USERS))
#     assert_returned_users(users, users_with_email)
