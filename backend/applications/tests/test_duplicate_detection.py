import pytest

from applications.models import Application

from .factories import valid_medic_payload, valid_player_payload, valid_referee_payload

pytestmark = pytest.mark.django_db

REGISTER_URL = "/api/public/applications/"
CHECK_PHONE_URL = "/api/public/applications/check-phone/"


def test_second_submission_with_same_phone_is_rejected(api_client):
    """Replaces the old soft-allow-and-flag behavior — a second
    registration with the same phone is now hard-blocked, matching
    "bir nömrə = bir qeydiyyat" across every role."""
    phone = "+994501234567"

    first_resp = api_client.post(REGISTER_URL, valid_player_payload(phone=phone), format="json")
    assert first_resp.status_code == 201

    second_resp = api_client.post(REGISTER_URL, valid_player_payload(phone=phone), format="json")
    assert second_resp.status_code == 400
    assert "phone" in second_resp.data
    assert Application.objects.filter(phone=phone).count() == 1


def test_same_phone_blocked_across_different_roles(api_client):
    phone = "+994551234567"
    player_resp = api_client.post(REGISTER_URL, valid_player_payload(phone=phone), format="json")
    assert player_resp.status_code == 201

    referee_resp = api_client.post(REGISTER_URL, valid_referee_payload(phone=phone), format="json")
    assert referee_resp.status_code == 400
    assert "phone" in referee_resp.data

    medic_resp = api_client.post(REGISTER_URL, valid_medic_payload(phone=phone), format="json")
    assert medic_resp.status_code == 400
    assert "phone" in medic_resp.data


@pytest.mark.parametrize(
    "first_raw,second_raw",
    [
        ("+994558850709", "055 885 07 09"),
        ("+994558850709", "55-885-07-09"),
        ("055 885 07 09", "55-885-07-09"),
    ],
)
def test_differently_formatted_same_number_detected_as_duplicate(api_client, first_raw, second_raw):
    first_resp = api_client.post(REGISTER_URL, valid_player_payload(phone=first_raw), format="json")
    assert first_resp.status_code == 201, first_resp.data

    second_resp = api_client.post(
        REGISTER_URL, valid_referee_payload(phone=second_raw), format="json"
    )
    assert second_resp.status_code == 400, second_resp.data
    assert "phone" in second_resp.data


def test_phone_stored_in_canonical_format_regardless_of_input_format(api_client):
    resp = api_client.post(
        REGISTER_URL, valid_player_payload(phone="055 885 07 09"), format="json"
    )
    assert resp.status_code == 201, resp.data
    application = Application.objects.get(id=resp.data["id"])
    assert application.phone == "+994558850709"


def test_check_phone_endpoint_reports_available_for_new_number(api_client):
    resp = api_client.post(CHECK_PHONE_URL, {"phone": "+994501234567"}, format="json")
    assert resp.status_code == 200
    assert resp.data == {"available": True}


def test_check_phone_endpoint_reports_unavailable_for_existing_number(api_client):
    phone = "+994501234567"
    api_client.post(REGISTER_URL, valid_player_payload(phone=phone), format="json")

    resp = api_client.post(CHECK_PHONE_URL, {"phone": "050 123 45 67"}, format="json")
    assert resp.status_code == 200
    assert resp.data == {"available": False}
