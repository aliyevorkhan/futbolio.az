import pytest

from applications.models import Application

from .factories import valid_medic_payload, valid_player_payload, valid_referee_payload

pytestmark = pytest.mark.django_db

REGISTER_URL = "/api/public/applications/"


def test_referee_instagram_handle_rejected(api_client):
    payload = valid_referee_payload(instagram_handle="some.referee")
    resp = api_client.post(REGISTER_URL, payload, format="json")
    assert resp.status_code == 400
    assert "instagram_handle" in resp.data
    assert not Application.objects.exists()


def test_medic_specialty_stored_as_list(api_client):
    payload = valid_medic_payload()
    payload["medic_details"]["specialty"] = ["paramedic", "nurse"]
    resp = api_client.post(REGISTER_URL, payload, format="json")
    assert resp.status_code == 201, resp.data

    application = Application.objects.get(id=resp.data["id"])
    assert application.medic_details.specialty == ["paramedic", "nurse"]


def test_player_pro_experience_requires_professional_periods(api_client):
    payload = valid_player_payload()
    payload["player_details"]["has_pro_experience"] = True
    payload["player_details"]["professional_periods"] = []
    resp = api_client.post(REGISTER_URL, payload, format="json")
    assert resp.status_code == 400
    assert not Application.objects.exists()


def test_player_pro_experience_accepted_with_professional_periods(api_client):
    payload = valid_player_payload()
    payload["player_details"]["has_pro_experience"] = True
    payload["player_details"]["professional_periods"] = [
        {"start_year": 2018, "end_year": 2020, "club": "Neftchi"}
    ]
    resp = api_client.post(REGISTER_URL, payload, format="json")
    assert resp.status_code == 201, resp.data

    application = Application.objects.get(id=resp.data["id"])
    periods = list(application.player_details.professional_periods.all())
    assert len(periods) == 1
    assert periods[0].club == "Neftchi"


def test_medic_zero_documents_is_valid(api_client):
    payload = valid_medic_payload()
    resp = api_client.post(REGISTER_URL, payload, format="json")
    assert resp.status_code == 201, resp.data
