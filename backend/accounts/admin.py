from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import AdminUser


@admin.register(AdminUser)
class AdminUserAdmin(UserAdmin):
    """Registered only for emergency django-admin access (manage.py /
    break-glass scenarios) — the real admin-account-management UI is the
    Next.js frontend's /admin/admin-users page against the DRF API."""

    ordering = ["email"]
    list_display = ["email", "role", "is_active", "is_staff", "last_login"]
    search_fields = ["email", "full_name"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Profile", {"fields": ("full_name", "role", "can_view_sensitive_files")}),
        ("Status", {"fields": ("is_active", "is_staff", "is_superuser", "must_change_password")}),
        ("Lockout", {"fields": ("failed_login_attempts", "locked_until")}),
    )
    add_fieldsets = ((None, {"fields": ("email", "password1", "password2")}),)
