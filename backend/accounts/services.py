import secrets
from datetime import timedelta

import pyotp
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import AdminPasswordResetToken, AdminUser, TOTPDevice

TOTP_ISSUER = "Futbolio Admin"


def get_or_create_totp_device(admin: AdminUser) -> TOTPDevice:
    device, _ = TOTPDevice.objects.get_or_create(admin=admin, defaults={"secret": pyotp.random_base32()})
    return device


def provisioning_uri(device: TOTPDevice, admin: AdminUser) -> str:
    return pyotp.totp.TOTP(device.secret).provisioning_uri(name=admin.email, issuer_name=TOTP_ISSUER)


def verify_totp_code(device: TOTPDevice, code: str) -> bool:
    return pyotp.totp.TOTP(device.secret).verify(code, valid_window=1)


def issue_password_reset_token(admin: AdminUser) -> AdminPasswordResetToken:
    return AdminPasswordResetToken.objects.create(
        admin=admin,
        token=secrets.token_urlsafe(32),
        expires_at=timezone.now() + timedelta(minutes=30),
    )


def send_password_set_email(admin: AdminUser, token: AdminPasswordResetToken) -> None:
    link = f"{settings.FRONTEND_URL}/admin/reset-password?token={token.token}"
    subject = "Futbolio admin — parolunuzu təyin edin"
    body = (
        f"Salam,\n\nFutbolio admin hesabınız üçün parol təyin etmək üçün aşağıdakı linkə keçin "
        f"(30 dəqiqə etibarlıdır, bir dəfə istifadə olunur):\n\n{link}\n"
    )
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [admin.email], fail_silently=True)


def send_password_reset_email(admin: AdminUser, token: AdminPasswordResetToken) -> None:
    link = f"{settings.FRONTEND_URL}/admin/reset-password?token={token.token}"
    subject = "Futbolio admin — parol bərpası"
    body = (
        f"Salam,\n\nParolunuzu bərpa etmək üçün aşağıdakı linkə keçin "
        f"(30 dəqiqə etibarlıdır, bir dəfə istifadə olunur):\n\n{link}\n\n"
        "Bu sorğunu siz etməmisinizsə, bu e-poçtu nəzərə almayın."
    )
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [admin.email], fail_silently=True)
