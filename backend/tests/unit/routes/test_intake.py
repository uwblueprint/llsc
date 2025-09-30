from fastapi import status

from tests.fixtures.models import create_test_form, create_test_submission, create_test_user


def test_list_forms(client, db_session, mock_auth_middleware):
    """Test GET /intake/forms endpoint"""
    # Create test form
    form = create_test_form(db_session)
    db_session.commit()

    # Make request
    response = client.get("/intake/forms")

    # Check response
    assert response.status_code == status.HTTP_200_OK
    forms = response.json()
    assert len(forms) == 1
    assert forms[0]["id"] == str(form.id)
    assert forms[0]["name"] == form.name
    assert forms[0]["type"] == "intake"


def test_create_submission(client, db_session, mock_auth_middleware):
    """Test POST /intake/submissions endpoint"""
    # Create test user and form
    form = create_test_form(db_session)
    db_session.commit()

    # Prepare submission data
    submission_data = {"form_id": str(form.id), "answers": {"test_question": "test answer", "numeric_question": 42}}

    # Make request
    response = client.post("/intake/submissions", json=submission_data)

    # Check response
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["form_id"] == str(form.id)
    assert data["answers"] == submission_data["answers"]


def test_get_own_submissions(client, db_session, mock_auth_middleware):
    """Test GET /intake/submissions endpoint - user can see their own submissions"""
    # Create test data
    user = create_test_user(db_session)
    submission = create_test_submission(db_session, user=user)
    db_session.commit()

    # Make request
    response = client.get("/intake/submissions")

    # Check response
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["total"] == 1
    assert len(data["submissions"]) == 1
    assert data["submissions"][0]["id"] == str(submission.id)


def test_update_submission(client, db_session, mock_auth_middleware):
    """Test PUT /intake/submissions/{submission_id} endpoint"""
    # Create test data
    user = create_test_user(db_session)
    submission = create_test_submission(db_session, user=user)
    db_session.commit()

    # Prepare update data
    update_data = {"answers": {"updated_field": "updated value", "another_field": 456}}

    # Make request
    response = client.put(f"/intake/submissions/{submission.id}", json=update_data)

    # Check response
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["answers"] == update_data["answers"]


def test_delete_submission(client, db_session, mock_auth_middleware):
    """Test DELETE /intake/submissions/{submission_id} endpoint"""
    # Create test data
    user = create_test_user(db_session)
    submission = create_test_submission(db_session, user=user)
    db_session.commit()

    # Make request
    response = client.delete(f"/intake/submissions/{submission.id}")

    # Check response
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["message"] == "Form submission deleted successfully"

    # Verify submission was deleted
    response = client.get(f"/intake/submissions/{submission.id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND
