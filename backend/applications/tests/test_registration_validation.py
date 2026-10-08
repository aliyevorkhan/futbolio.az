import pytest

from applications.models import Application

from .factories import make_admin, valid_player_payload

pytestmark = pytest.mark.django_db

REGISTER_URL = "/api/public/applications/"


def test_underage_rejected_even_if_client_bypassed(api_client):
    payload = valid_player_payload(age=17)
    resp = api_client.post(REGISTER_URL, payload, format="json")
    assert resp.status_code == 400
    assert not Application.objects.exists()


@pytest.mark.parametrize("code", ["10", "50", "51", "55", "60", "70", "77", "99"])
def test_az_phone_operator_codes_all_accepted(api_client, code):
    payload = valid_player_payload(phone=f"+994{code}1234567")
    resp = api_client.post(REGISTER_URL, payload, format="json")
    assert resp.status_code == 201, resp.data


def test_invalid_phone_operator_code_rejected(api_client):
    payload = valid_player_payload(phone="+994201234567")
    resp = api_client.post(REGISTER_URL, payload, format="json")
    assert resp.status_code == 400
    assert not Application.objects.exists()


def test_script_tag_in_full_name_rejected_not_executed(api_client):
    payload = valid_player_payload(full_name="<script>alert(1)</script>")
    resp = api_client.post(REGISTER_URL, payload, format="json")
    assert resp.status_code == 400
    assert not Application.objects.exists()


def test_sql_injection_shaped_free_text_stored_and_returned_literally(api_client):
    admin = make_admin()
    payload = valid_player_payload()
    injection = "Robert'); DROP TABLE applications_application;--"
    payload["player_details"]["club_experience_text"] = injection

    resp = api_client.post(REGISTER_URL, payload, format="json")
    assert resp.status_code == 201
    assert Application.objects.count() == 1  # table intact, no injection executed

    api_client.force_authenticate(user=admin)
    detail_resp = api_client.get(f"/api/admin/applications/{resp.data['id']}/")
    assert detail_resp.status_code == 200
    assert detail_resp.data["player_details"]["club_experience_text"] == injection


def test_honeypot_filled_rejected_with_generic_error_shape(api_client):
    payload = valid_player_payload(website="https://spambot.example/")
    resp = api_client.post(REGISTER_URL, payload, format="json")
    assert resp.status_code == 400
    body = str(resp.data).lower()
    assert "honeypot" not in body
    assert "bot" not in body
    assert not Application.objects.exists()


def test_missing_turnstile_token_rejected_when_bypass_disabled(api_client, settings):
    settings.TURNSTILE_BYPASS = False
    payload = valid_player_payload(turnstile_token="")
    resp = api_client.post(REGISTER_URL, payload, format="json")
    assert resp.status_code == 400
    assert not Application.objects.exists()
