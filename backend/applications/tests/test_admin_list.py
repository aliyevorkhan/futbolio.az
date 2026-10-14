import pytest

from .factories import make_admin, valid_player_payload, valid_referee_payload

pytestmark = pytest.mark.django_db

REGISTER_URL = "/api/public/applications/"
LIST_URL = "/api/admin/applications/"


def test_list_page_size_is_20(api_client):
    admin = make_admin()
    for i in range(21):
        letter = chr(ord("A") + i)
        resp = api_client.post(
            REGISTER_URL,
            valid_player_payload(full_name=f"Player Letter {letter}", phone=f"+99450{i:07d}"),
            format="json",
        )
        assert resp.status_code == 201, resp.data

    api_client.force_authenticate(user=admin)
    resp = api_client.get(LIST_URL)
    assert resp.status_code == 200
    assert resp.data["count"] == 21
    assert len(resp.data["results"]) == 20
    assert resp.data["next"] is not None


def test_player_row_exposes_level_but_referee_does_not(api_client):
    admin = make_admin()
    player_resp = api_client.post(
        REGISTER_URL, valid_player_payload(full_name="Level Test Player"), format="json"
    )
    assert player_resp.status_code == 201, player_resp.data
    referee_resp = api_client.post(
        REGISTER_URL, valid_referee_payload(full_name="Level Test Referee"), format="json"
    )
    assert referee_resp.status_code == 201, referee_resp.data

    api_client.force_authenticate(user=admin)
    resp = api_client.get(LIST_URL)
    assert resp.status_code == 200

    by_name = {row["full_name"]: row for row in resp.data["results"]}
    assert by_name["Level Test Player"]["level"] == "amateur"
    assert by_name["Level Test Referee"]["level"] == ""


def test_photo_thumbnail_url_present_once_photo_is_clean(api_client):
    from common.enums import ScanStatus
    from files.models import ApplicationFile

    admin = make_admin()
    resp = api_client.post(REGISTER_URL, valid_player_payload(full_name="Thumb Test"), format="json")
    assert resp.status_code == 201, resp.data
    app_id = resp.data["id"]

    ApplicationFile.objects.filter(application_id=app_id, kind="photo").update(
        scan_status=ScanStatus.CLEAN
    )

    api_client.force_authenticate(user=admin)
    list_resp = api_client.get(LIST_URL)
    assert list_resp.status_code == 200
    row = next(r for r in list_resp.data["results"] if r["id"] == app_id)
    assert row["photo_thumbnail_url"] is not None
    assert row["photo_thumbnail_url"].startswith("http")
