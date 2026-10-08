import pytest

from applications.models import Application
from audit.models import AuditLogEntry

from .factories import make_admin, valid_player_payload

pytestmark = pytest.mark.django_db

REGISTER_URL = "/api/public/applications/"
EXPORT_URL = "/api/admin/applications/export/"


def test_formula_injection_guarded_in_csv_export(api_client):
    admin = make_admin()
    # "-" is both a valid full_name character and a formula-trigger char.
    resp = api_client.post(REGISTER_URL, valid_player_payload(full_name="-Elnur Mammadov"), format="json")
    assert resp.status_code == 201

    api_client.force_authenticate(user=admin)
    export_resp = api_client.get(f"{EXPORT_URL}?format=csv")
    assert export_resp.status_code == 200

    content = export_resp.content.decode("utf-8-sig")
    assert "'-Elnur Mammadov" in content


def test_export_creates_exactly_one_audit_log_entry_with_row_count(api_client):
    admin = make_admin(email="admin2@futbolio.az")
    resp = api_client.post(REGISTER_URL, valid_player_payload(), format="json")
    assert resp.status_code == 201
    assert Application.objects.count() == 1

    api_client.force_authenticate(user=admin)
    before = AuditLogEntry.objects.filter(action="admin.application.exported").count()

    export_resp = api_client.get(f"{EXPORT_URL}?format=csv")
    assert export_resp.status_code == 200

    entries = AuditLogEntry.objects.filter(action="admin.application.exported")
    assert entries.count() == before + 1
    latest = entries.order_by("-created_at").first()
    assert latest.metadata["row_count"] == 1
