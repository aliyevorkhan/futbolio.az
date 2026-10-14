import pytest

from applications.models import Application, ApplicationIdCounter
from applications.services import generate_display_id

from .factories import make_admin, valid_medic_payload, valid_player_payload, valid_referee_payload

pytestmark = pytest.mark.django_db

REGISTER_URL = "/api/public/applications/"


def test_registration_assigns_sequential_display_id_per_role(api_client):
    first = api_client.post(REGISTER_URL, valid_player_payload(phone="+994501230001"), format="json")
    second = api_client.post(REGISTER_URL, valid_player_payload(phone="+994501230002"), format="json")
    referee = api_client.post(REGISTER_URL, valid_referee_payload(phone="+994501230003"), format="json")
    assert first.status_code == second.status_code == referee.status_code == 201

    first_app = Application.objects.get(id=first.data["id"])
    second_app = Application.objects.get(id=second.data["id"])
    referee_app = Application.objects.get(id=referee.data["id"])

    assert first_app.display_id == "F0001"
    assert second_app.display_id == "F0002"
    assert referee_app.display_id == "R0001"


def test_medic_gets_its_own_prefix_and_sequence(api_client):
    from common.enums import FileKind

    from .factories import make_file

    payload = valid_medic_payload(phone="+994501230004")
    import uuid

    upload_session_id = uuid.UUID(payload["upload_session_id"])
    doc = make_file(upload_session_id, kind=FileKind.DOCUMENT, original_name="diploma.pdf")
    payload["file_ids"].append(str(doc.id))

    resp = api_client.post(REGISTER_URL, payload, format="json")
    assert resp.status_code == 201, resp.data
    application = Application.objects.get(id=resp.data["id"])
    assert application.display_id == "M0001"


def test_display_id_is_never_reused_after_hard_delete(api_client):
    # Created directly via the ORM (no attached files) so the hard-delete
    # endpoint's storage cleanup doesn't need a reachable S3/MinIO
    # endpoint — same environment constraint as
    # test_admin_tabs.py::test_hard_delete_only_meaningful_after_soft_delete_frees_phone.
    import uuid

    from common.enums import ApplicationRole, ApplicationStatus, District

    admin = make_admin()
    first_app = Application.objects.create(
        role=ApplicationRole.PLAYER,
        display_id=generate_display_id(ApplicationRole.PLAYER),
        full_name="First Person",
        date_of_birth="1998-01-01",
        phone="+994501230005",
        district=District.YASAMAL,
        status=ApplicationStatus.REJECTED,
        upload_session_id=uuid.uuid4(),
    )
    first_display_id = first_app.display_id

    api_client.force_authenticate(user=admin)
    delete_resp = api_client.delete(
        f"/api/admin/applications/{first_app.id}/", {"confirm": True}, format="json"
    )
    assert delete_resp.status_code == 204
    assert not Application.objects.filter(id=first_app.id).exists()

    api_client.force_authenticate(user=None)
    second_resp = api_client.post(REGISTER_URL, valid_player_payload(phone="+994501230006"), format="json")
    assert second_resp.status_code == 201
    second_display_id = Application.objects.get(id=second_resp.data["id"]).display_id

    assert second_display_id != first_display_id
    # The counter only ever goes up — the next number after a delete is
    # still the next number, not a reused/filled gap.
    assert int(second_display_id[1:]) > int(first_display_id[1:])


def test_generate_display_id_is_unique_per_call():
    ids = {generate_display_id("player") for _ in range(5)}
    assert len(ids) == 5
    assert all(i.startswith("F") for i in ids)


def test_counter_rows_are_independent_per_role():
    generate_display_id("player")
    generate_display_id("referee")
    generate_display_id("medic")
    assert ApplicationIdCounter.objects.count() == 3
    assert {c.role for c in ApplicationIdCounter.objects.all()} == {"player", "referee", "medic"}


def test_display_id_exposed_on_admin_list_and_detail(api_client):
    admin = make_admin()
    resp = api_client.post(REGISTER_URL, valid_player_payload(phone="+994501230007"), format="json")
    assert resp.status_code == 201
    app_id = resp.data["id"]

    api_client.force_authenticate(user=admin)
    list_resp = api_client.get("/api/admin/applications/")
    row = next(r for r in list_resp.data["results"] if r["id"] == app_id)
    assert row["display_id"].startswith("F")

    detail_resp = api_client.get(f"/api/admin/applications/{app_id}/")
    assert detail_resp.data["display_id"] == row["display_id"]


def test_search_by_display_id(api_client):
    admin = make_admin()
    resp = api_client.post(REGISTER_URL, valid_player_payload(phone="+994501230008"), format="json")
    assert resp.status_code == 201
    display_id = Application.objects.get(id=resp.data["id"]).display_id

    api_client.force_authenticate(user=admin)
    search_resp = api_client.get("/api/admin/applications/", {"search": display_id})
    assert any(a["id"] == resp.data["id"] for a in search_resp.data["results"])
