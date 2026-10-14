import uuid
from io import StringIO

import pytest
from django.core.management import call_command

from applications.models import Application
from applications.services import find_duplicate_phone_groups

from .factories import make_admin, valid_player_payload, valid_referee_payload

pytestmark = pytest.mark.django_db

REGISTER_URL = "/api/public/applications/"
DUPLICATE_PHONES_URL = "/api/admin/applications/duplicate-phones/"


def _create_application_bypassing_uniqueness(phone, **overrides):
    """The API itself now blocks a duplicate — this directly inserts a
    second row to simulate the one scenario the "Dublikat nömrələr"
    report exists for: data that became a duplicate before this feature
    shipped (pre-cutover rows), never something the live API can produce
    today."""
    payload = valid_referee_payload(phone=phone, **overrides)

    application = Application.objects.create(
        role=payload["role"],
        full_name=payload["full_name"],
        date_of_birth=payload["date_of_birth"],
        phone=phone,
        district=payload["district"],
        upload_session_id=uuid.uuid4(),
    )
    return application


def test_report_command_exits_nonzero_and_lists_groups_when_duplicates_exist(api_client):
    phone = "+994501234567"
    resp = api_client.post(REGISTER_URL, valid_player_payload(phone=phone), format="json")
    assert resp.status_code == 201

    _create_application_bypassing_uniqueness(phone, full_name="Second Person")

    out = StringIO()
    with pytest.raises(SystemExit) as exc_info:
        call_command("report_duplicate_phones", stdout=out)
    assert exc_info.value.code == 1
    assert phone in out.getvalue()


def test_duplicate_phone_groups_query_function_groups_correctly(api_client):
    phone = "+994501234567"
    resp = api_client.post(REGISTER_URL, valid_player_payload(phone=phone), format="json")
    assert resp.status_code == 201
    _create_application_bypassing_uniqueness(phone, full_name="Second Person")

    groups = find_duplicate_phone_groups()
    assert len(groups) == 1
    assert groups[0]["phone"] == phone
    assert len(groups[0]["applications"]) == 2
    names = {a["full_name"] for a in groups[0]["applications"]}
    assert names == {"Anar Quliyev", "Second Person"}


def test_admin_duplicate_phones_endpoint_requires_admin(api_client):
    resp = api_client.get(DUPLICATE_PHONES_URL)
    assert resp.status_code in (401, 403)


def test_admin_duplicate_phones_endpoint_returns_groups(api_client):
    admin = make_admin()
    phone = "+994501234567"
    resp = api_client.post(REGISTER_URL, valid_player_payload(phone=phone), format="json")
    assert resp.status_code == 201
    _create_application_bypassing_uniqueness(phone, full_name="Second Person")

    api_client.force_authenticate(user=admin)
    resp = api_client.get(DUPLICATE_PHONES_URL)
    assert resp.status_code == 200
    assert len(resp.data) == 1
    assert resp.data[0]["phone"] == phone


def test_admin_can_edit_phone_number(api_client):
    admin = make_admin()
    resp = api_client.post(REGISTER_URL, valid_player_payload(), format="json")
    assert resp.status_code == 201
    app_id = resp.data["id"]

    api_client.force_authenticate(user=admin)
    patch_resp = api_client.patch(
        f"/api/admin/applications/{app_id}/", {"phone": "055 999 11 22"}, format="json"
    )
    assert patch_resp.status_code == 200, patch_resp.data
    application = Application.objects.get(id=app_id)
    assert application.phone == "+994559991122"


def test_admin_phone_edit_rejects_if_new_number_belongs_to_another_candidate(api_client):
    admin = make_admin()
    first_resp = api_client.post(
        REGISTER_URL, valid_player_payload(phone="+994501234567"), format="json"
    )
    second_resp = api_client.post(
        REGISTER_URL, valid_referee_payload(phone="+994551234567"), format="json"
    )
    assert first_resp.status_code == 201
    assert second_resp.status_code == 201

    api_client.force_authenticate(user=admin)
    patch_resp = api_client.patch(
        f"/api/admin/applications/{second_resp.data['id']}/",
        {"phone": "+994501234567"},
        format="json",
    )
    assert patch_resp.status_code == 400
    assert "phone" in patch_resp.data
