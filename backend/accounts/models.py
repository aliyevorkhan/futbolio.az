import uuid

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from common.enums import AdminRole

from .managers import AdminUserManager


class AdminUser(AbstractBaseUser, PermissionsMixin):
    """The only kind of account this product has — candidates never get
    one (spec section 3). `is_staff`/`is_superuser` from PermissionsMixin
    are kept solely so `django-admin/` (emergency/manage.py access only)
    still works; all real authorization in the product uses `role` via
    common.permissions.IsAdmin / IsSuperAdmin, checked server-side on every
    view, never inferred from these Django-internal flags.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=120, blank=True)
    role = models.CharField(max_length=20, choices=AdminRole.choices, default=AdminRole.ADMIN)
    can_view_sensitive_files = models.BooleanField(default=False)
    must_change_password = models.BooleanField(default=False)

    failed_login_attempts = models.PositiveSmallIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    created_by = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="created_admins"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = AdminUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        ordering = ["email"]

    def __str__(self):
        return self.email

    @property
    def is_locked(self) -> bool:
        return bool(self.locked_until and self.locked_until > timezone.now())

    def register_failed_attempt(self, threshold: int, lockout_minutes: int) -> None:
        from datetime import timedelta

        self.failed_login_attempts += 1
        if self.failed_login_attempts >= threshold:
            self.locked_until = timezone.now() + timedelta(minutes=lockout_minutes)
        self.save(update_fields=["failed_login_attempts", "locked_until"])

    def reset_failed_attempts(self) -> None:
        if self.failed_login_attempts or self.locked_until:
            self.failed_login_attempts = 0
            self.locked_until = None
            self.save(update_fields=["failed_login_attempts", "locked_until"])


class TOTPDevice(models.Model):
    """Mandatory for every admin — login always routes through enrollment
    if `confirmed_at` is unset; no session is ever issued otherwise
    (enforced in accounts/views.py, not just here).
    """

    admin = models.OneToOneField(AdminUser, on_delete=models.CASCADE, related_name="totp_device")
    secret = models.CharField(max_length=64)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_confirmed(self) -> bool:
        return self.confirmed_at is not None


class AdminPasswordResetToken(models.Model):
    admin = models.ForeignKey(AdminUser, on_delete=models.CASCADE, related_name="password_reset_tokens")
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)

    @property
    def is_valid(self) -> bool:
        return self.used_at is None and self.expires_at > timezone.now()
