import uuid

import pytest

pytestmark = pytest.mark.django_db

UNAUTHENTICATED_STATUSES = (401, 403)


def test_list_requires_auth(api_client):
    assert api_client.get("/api/admin/applications/").status_code in UNAUTHENTICATED_STATUSES


def test_export_requires_auth(api_client):
    assert api_client.get("/api/admin/applications/export/").status_code in UNAUTHENTICATED_STATUSES


def test_detail_requires_auth(api_client):
    random_id = uuid.uuid4()
    assert api_client.get(f"/api/admin/applications/{random_id}/").status_code in UNAUTHENTICATED_STATUSES


def test_delete_requires_auth(api_client):
    random_id = uuid.uuid4()
    resp = api_client.delete(f"/api/admin/applications/{random_id}/", {"confirm": True}, format="json")
    assert resp.status_code in UNAUTHENTICATED_STATUSES


def test_status_update_requires_auth(api_client):
    random_id = uuid.uuid4()
    resp = api_client.patch(
        f"/api/admin/applications/{random_id}/status/", {"status": "reviewed"}, format="json"
    )
    assert resp.status_code in UNAUTHENTICATED_STATUSES


def test_notes_list_requires_auth(api_client):
    random_id = uuid.uuid4()
    assert (
        api_client.get(f"/api/admin/applications/{random_id}/notes/").status_code
        in UNAUTHENTICATED_STATUSES
    )


def test_notes_create_requires_auth(api_client):
    random_id = uuid.uuid4()
    resp = api_client.post(f"/api/admin/applications/{random_id}/notes/", {"text": "x"}, format="json")
    assert resp.status_code in UNAUTHENTICATED_STATUSES
