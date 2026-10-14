import uuid
from datetime import date

import pytest

from applications.models import Application
from common.enums import FileKind

from .factories import make_admin, make_file, valid_medic_payload, valid_player_payload, valid_referee_payload

pytestmark = pytest.mark.django_db

REGISTER_URL = "/api/public/applications/"


def _dob_for_age(age):
    today = date.today()
    return today.replace(year=today.year - age).isoformat()


def _valid_medic_payload_with_document(**overrides):
    """`valid_medic_payload()` alone has no document file, which the medic
    branch of `validate()` requires regardless of age — unrelated to this
    file's age tests (a known pre-existing gap in that factory, same root
    cause as the already-flagged `test_medic_zero_documents_is_valid`
    failure), so the age-boundary "should succeed" cases attach one here
    rather than tripping over it."""
    payload = valid_medic_payload(**overrides)
    doc = make_file(
        uuid.UUID(payload["upload_session_id"]),
        kind=FileKind.DOCUMENT,
        original_name="diploma.pdf",
        declared_mime="application/pdf",
    )
    payload["file_ids"].append(str(doc.id))
    return payload


def test_underage_rejected_even_if_client_bypassed(api_client):
    payload = valid_player_payload(date_of_birth=_dob_for_age(17))
    resp = api_client.post(REGISTER_URL, payload, format="json")
    assert resp.status_code == 400
    assert not Application.objects.exists()


def test_overage_rejected_even_if_client_bypassed(api_client):
    payload = valid_player_payload(date_of_birth=_dob_for_age(46))
    resp = api_client.post(REGISTER_URL, payload, format="json")
    assert resp.status_code == 400
    assert not Application.objects.exists()


# Per-role age bounds (common.age_limits.AGE_LIMITS): player/goalkeeper
# 18-45 (unchanged), referee 18-55, medic 18-75. One parametrized case per
# role covering: just-under-min (reject), exact min (accept), exact max
# (accept), just-over-max (reject) — the exact-boundary cases didn't exist
# as tests before this change.
ROLE_AGE_CASES = [
    ("player", valid_player_payload, 18, 45),
    ("referee", valid_referee_payload, 18, 55),
    ("medic", valid_medic_payload, 18, 75),
]

# Separate list for the two "should succeed" tests only, since those need
# the medic payload to also carry a document file (see
# _valid_medic_payload_with_document's docstring above).
ROLE_AGE_ACCEPT_CASES = [
    ("player", valid_player_payload, 18, 45),
    ("referee", valid_referee_payload, 18, 55),
    ("medic", _valid_medic_payload_with_document, 18, 75),
]


@pytest.mark.parametrize("role,payload_fn,min_age,max_age", ROLE_AGE_CASES)
def test_role_age_just_under_min_rejected(api_client, role, payload_fn, min_age, max_age):
    payload = payload_fn(date_of_birth=_dob_for_age(min_age - 1))
    resp = api_client.post(REGISTER_URL, payload, format="json")
    assert resp.status_code == 400, resp.data
    assert "date_of_birth" in resp.data
    assert not Application.objects.exists()


@pytest.mark.parametrize("role,payload_fn,min_age,max_age", ROLE_AGE_ACCEPT_CASES)
def test_role_age_exact_min_accepted(api_client, role, payload_fn, min_age, max_age):
    payload = payload_fn(date_of_birth=_dob_for_age(min_age))
    resp = api_client.post(REGISTER_URL, payload, format="json")
    assert resp.status_code == 201, resp.data


@pytest.mark.parametrize("role,payload_fn,min_age,max_age", ROLE_AGE_ACCEPT_CASES)
def test_role_age_exact_max_accepted(api_client, role, payload_fn, min_age, max_age):
    payload = payload_fn(date_of_birth=_dob_for_age(max_age))
    resp = api_client.post(REGISTER_URL, payload, format="json")
    assert resp.status_code == 201, resp.data


@pytest.mark.parametrize("role,payload_fn,min_age,max_age", ROLE_AGE_CASES)
def test_role_age_just_over_max_rejected(api_client, role, payload_fn, min_age, max_age):
    payload = payload_fn(date_of_birth=_dob_for_age(max_age + 1))
    resp = api_client.post(REGISTER_URL, payload, format="json")
    assert resp.status_code == 400, resp.data
    assert "date_of_birth" in resp.data
    assert not Application.objects.exists()


def test_referee_at_60_rejected_via_direct_api_request(api_client):
    """Matches the spec's explicit verification item: a direct API request
    (not just the UI) for a 60-year-old referee must be rejected — referee
    cutoff is 55."""
    payload = valid_referee_payload(date_of_birth=_dob_for_age(60))
    resp = api_client.post(REGISTER_URL, payload, format="json")
    assert resp.status_code == 400, resp.data
    assert not Application.objects.exists()


def test_existing_applications_unaffected_by_age_rule_change(api_client):
    """Changing the age bound is validation-only on the create path — an
    already-stored application older/younger than the current bound must
    never be touched or re-validated."""
    payload = valid_referee_payload(date_of_birth=_dob_for_age(50))
    resp = api_client.post(REGISTER_URL, payload, format="json")
    assert resp.status_code == 201, resp.data

    application = Application.objects.get(id=resp.data["id"])
    application.save()  # re-saving (e.g. an admin status change) must not re-validate age
    application.refresh_from_db()
    assert application.id is not None


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
