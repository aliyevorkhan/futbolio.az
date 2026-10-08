import pytest

from applications.models import Application

from .factories import valid_player_payload

pytestmark = pytest.mark.django_db

REGISTER_URL = "/api/public/applications/"


def test_second_submission_with_same_phone_is_flagged_duplicate(api_client):
    phone = "+994501234567"

    first_resp = api_client.post(REGISTER_URL, valid_player_payload(phone=phone), format="json")
    assert first_resp.status_code == 201
    assert "duplicate" not in str(first_resp.data).lower()

    second_resp = api_client.post(REGISTER_URL, valid_player_payload(phone=phone), format="json")
    assert second_resp.status_code == 201
    assert "duplicate" not in str(second_resp.data).lower()

    first_app = Application.objects.get(id=first_resp.data["id"])
    second_app = Application.objects.get(id=second_resp.data["id"])

    assert first_app.is_duplicate is False
    assert second_app.is_duplicate is True
