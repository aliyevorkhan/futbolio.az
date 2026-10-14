import pytest

from applications.models import Application, StatusChange

from .factories import make_admin, valid_player_payload

pytestmark = pytest.mark.django_db

REGISTER_URL = "/api/public/applications/"
LIST_URL = "/api/admin/applications/"
COUNTS_URL = "/api/admin/applications/counts/"
BULK_STATUS_URL = "/api/admin/applications/bulk-status/"


def test_tab_filter_groups_statuses_correctly(api_client):
    admin = make_admin()

    new_resp = api_client.post(REGISTER_URL, valid_player_payload(phone="+994501111111"), format="json")
    accepted_resp = api_client.post(
        REGISTER_URL, valid_player_payload(phone="+994502222222"), format="json"
    )
    rejected_resp = api_client.post(
        REGISTER_URL, valid_player_payload(phone="+994503333333"), format="json"
    )
    assert new_resp.status_code == accepted_resp.status_code == rejected_resp.status_code == 201

    api_client.force_authenticate(user=admin)
    api_client.patch(
        f"/api/admin/applications/{accepted_resp.data['id']}/status/",
        {"status": "accepted"},
        format="json",
    )
    api_client.patch(
        f"/api/admin/applications/{rejected_resp.data['id']}/status/",
        {"status": "rejected"},
        format="json",
    )

    pending_ids = {a["id"] for a in api_client.get(LIST_URL, {"tab": "pending"}).data["results"]}
    accepted_ids = {a["id"] for a in api_client.get(LIST_URL, {"tab": "accepted"}).data["results"]}
    deleted_ids = {a["id"] for a in api_client.get(LIST_URL, {"tab": "deleted"}).data["results"]}

    assert new_resp.data["id"] in pending_ids
    assert accepted_resp.data["id"] in accepted_ids
    assert rejected_resp.data["id"] in deleted_ids
    assert accepted_resp.data["id"] not in pending_ids
    assert rejected_resp.data["id"] not in pending_ids


def test_counts_endpoint_reflects_current_tabs(api_client):
    admin = make_admin()
    resp = api_client.post(REGISTER_URL, valid_player_payload(phone="+994504444444"), format="json")
    assert resp.status_code == 201

    api_client.force_authenticate(user=admin)
    counts = api_client.get(COUNTS_URL).data
    assert counts["pending"] >= 1
    assert "accepted" in counts
    assert "deleted" in counts


def test_bulk_status_update_accepts_multiple_applications(api_client):
    admin = make_admin()
    ids = []
    for i in range(3):
        resp = api_client.post(
            REGISTER_URL, valid_player_payload(phone=f"+99450555555{i}"), format="json"
        )
        assert resp.status_code == 201
        ids.append(resp.data["id"])

    api_client.force_authenticate(user=admin)
    bulk_resp = api_client.post(
        BULK_STATUS_URL, {"ids": ids, "status": "accepted"}, format="json"
    )
    assert bulk_resp.status_code == 200
    assert set(bulk_resp.data["updated"]) == set(ids)

    for app_id in ids:
        application = Application.objects.get(id=app_id)
        assert application.status == "accepted"
        assert StatusChange.objects.filter(application=application, to_status="accepted").exists()


def test_restore_puts_application_back_in_its_previous_pending_status(api_client):
    admin = make_admin()
    resp = api_client.post(REGISTER_URL, valid_player_payload(phone="+994506666666"), format="json")
    assert resp.status_code == 201
    app_id = resp.data["id"]

    api_client.force_authenticate(user=admin)
    api_client.patch(f"/api/admin/applications/{app_id}/status/", {"status": "reviewed"}, format="json")
    api_client.patch(f"/api/admin/applications/{app_id}/status/", {"status": "rejected"}, format="json")

    restore_resp = api_client.post(f"/api/admin/applications/{app_id}/restore/")
    assert restore_resp.status_code == 200
    assert restore_resp.data["status"] == "reviewed"


def test_restore_falls_back_to_new_with_no_pending_history(api_client):
    admin = make_admin()
    resp = api_client.post(REGISTER_URL, valid_player_payload(phone="+994507777777"), format="json")
    assert resp.status_code == 201
    app_id = resp.data["id"]

    api_client.force_authenticate(user=admin)
    api_client.patch(f"/api/admin/applications/{app_id}/status/", {"status": "rejected"}, format="json")

    restore_resp = api_client.post(f"/api/admin/applications/{app_id}/restore/")
    assert restore_resp.status_code == 200
    assert restore_resp.data["status"] == "new"


def test_hard_delete_only_meaningful_after_soft_delete_frees_phone(api_client):
    """Permanent delete removes the row entirely — a new registration
    with that same phone must then succeed. Created directly via the ORM
    with no attached files, so this doesn't depend on a reachable S3/MinIO
    endpoint for cleanup (same environment constraint as this repo's other
    storage-touching tests) — delete_files_for_application's own file-
    deletion loop is exercised separately wherever files really exist."""
    import uuid as uuid_module

    from applications.services import generate_display_id
    from common.enums import ApplicationRole, ApplicationStatus, District

    admin = make_admin()
    phone = "+994508888888"
    application = Application.objects.create(
        role=ApplicationRole.PLAYER,
        display_id=generate_display_id(ApplicationRole.PLAYER),
        full_name="Delete Me",
        date_of_birth="1998-01-01",
        phone=phone,
        district=District.YASAMAL,
        status=ApplicationStatus.REJECTED,
        upload_session_id=uuid_module.uuid4(),
    )

    api_client.force_authenticate(user=admin)
    delete_resp = api_client.delete(
        f"/api/admin/applications/{application.id}/", {"confirm": True}, format="json"
    )
    assert delete_resp.status_code == 204
    assert not Application.objects.filter(id=application.id).exists()

    api_client.force_authenticate(user=None)
    second_resp = api_client.post(REGISTER_URL, valid_player_payload(phone=phone), format="json")
    assert second_resp.status_code == 201
