import pyotp
import pytest
from django.urls import reverse

from accounts.models import AdminUser
from common.enums import AdminRole

pytestmark = pytest.mark.django_db

EMAIL = "admin@futbolio.az"
PASSWORD = "correct-horse-battery-staple"


def _create_admin(email=EMAIL, password=PASSWORD, role=AdminRole.ADMIN):
    return AdminUser.objects.create_user(email=email, password=password, role=role, is_active=True)


def _login(api_client, email=EMAIL, password=PASSWORD):
    return api_client.post(reverse("admin-login"), {"email": email, "password": password})


def test_login_without_confirmed_totp_requires_enrollment(api_client):
    _create_admin()
    resp = _login(api_client)
    assert resp.status_code == 200
    assert resp.data["totp_enrollment_required"] is True
    assert "login_token" in resp.data


def test_no_session_without_confirmed_totp(api_client):
    _create_admin()
    login_token = _login(api_client).data["login_token"]

    enroll_resp = api_client.post(reverse("admin-totp-enroll"), {"login_token": login_token})
    assert enroll_resp.status_code == 200
    secret = enroll_resp.data["secret"]

    bad_code_resp = api_client.post(
        reverse("admin-totp-confirm"), {"login_token": login_token, "code": "000000"}
    )
    assert bad_code_resp.status_code == 401

    me_resp = api_client.get(reverse("admin-me"))
    assert me_resp.status_code in (401, 403)

    code = pyotp.TOTP(secret).now()
    confirm_resp = api_client.post(reverse("admin-totp-confirm"), {"login_token": login_token, "code": code})
    assert confirm_resp.status_code == 200

    me_resp = api_client.get(reverse("admin-me"))
    assert me_resp.status_code == 200
    assert me_resp.data["email"] == EMAIL


def test_lockout_after_five_failed_attempts(api_client, settings):
    settings.ADMIN_LOGIN_LOCKOUT_THRESHOLD = 5
    _create_admin()
    for _ in range(5):
        resp = api_client.post(reverse("admin-login"), {"email": EMAIL, "password": "wrong-password"})
        assert resp.status_code == 401

    locked_resp = _login(api_client)
    assert locked_resp.status_code == 423


def test_password_reset_token_single_use(api_client):
    from datetime import timedelta

    from django.utils import timezone

    from accounts.models import AdminPasswordResetToken

    user = _create_admin()
    token = AdminPasswordResetToken.objects.create(
        admin=user, token="test-token-value", expires_at=timezone.now() + timedelta(minutes=30)
    )

    resp = api_client.post(
        reverse("admin-password-reset-confirm"),
        {"token": token.token, "new_password": "another-strong-passphrase-99"},
    )
    assert resp.status_code == 200

    resp2 = api_client.post(
        reverse("admin-password-reset-confirm"),
        {"token": token.token, "new_password": "yet-another-strong-pass-88"},
    )
    assert resp2.status_code == 400


def test_argon2_hash_used(api_client):
    user = _create_admin()
    assert user.password.startswith("argon2$")


def test_rbac_admin_cannot_manage_admin_users(api_client):
    user = _create_admin(role=AdminRole.ADMIN)
    api_client.force_authenticate(user=user)
    resp = api_client.get("/api/admin/admin-users/")
    assert resp.status_code == 403


def test_rbac_super_admin_can_manage_admin_users(api_client):
    user = _create_admin(email="super@futbolio.az", role=AdminRole.SUPER_ADMIN)
    api_client.force_authenticate(user=user)
    resp = api_client.get("/api/admin/admin-users/")
    assert resp.status_code == 200
