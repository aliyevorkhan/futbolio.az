import uuid
from datetime import date, timedelta

import pytest
from django.utils import timezone

from applications.models import Application, Consent
from applications.services import generate_display_id
from applications.tasks import purge_expired_applications_task
from common.enums import ApplicationStatus

from .factories import valid_player_payload

pytestmark = pytest.mark.django_db

REGISTER_URL = "/api/public/applications/"


def test_data_processing_consent_declined_rejects_submission(api_client):
    payload = valid_player_payload()
    payload["consents"] = [
        {"type": "data_processing", "accepted": False},
        {"type": "social_share", "accepted": False},
        {"type": "age_18_confirmation", "accepted": True},
    ]
    resp = api_client.post(REGISTER_URL, payload, format="json")
    assert resp.status_code == 400
    assert not Application.objects.exists()


def test_all_three_consents_always_created(api_client):
    resp = api_client.post(REGISTER_URL, valid_player_payload(), format="json")
    assert resp.status_code == 201

    application = Application.objects.get(id=resp.data["id"])
    consents = Consent.objects.filter(application=application)
    assert consents.count() == 3
    assert {c.type for c in consents} == {"data_processing", "social_share", "age_18_confirmation"}


def test_consent_ip_hash_never_equals_raw_client_ip(api_client):
    resp = api_client.post(REGISTER_URL, valid_player_payload(), format="json")
    assert resp.status_code == 201

    application = Application.objects.get(id=resp.data["id"])
    for consent in Consent.objects.filter(application=application):
        assert consent.ip_hash != "127.0.0.1"
        assert len(consent.ip_hash) == 64


def test_purge_task_stages_stale_rejected_application():
    application = Application.objects.create(
        role="player",
        display_id=generate_display_id("player"),
        full_name="Kamran Aslanov",
        date_of_birth=date(1996, 1, 1),
        phone="+994551234567",
        district="yasamal",
        status=ApplicationStatus.REJECTED,
        upload_session_id=uuid.uuid4(),
    )
    stale_date = timezone.now() - timedelta(days=400)
    Application.objects.filter(pk=application.pk).update(updated_at=stale_date)

    purge_expired_applications_task()

    application.refresh_from_db()
    assert application.deleted_at is not None
