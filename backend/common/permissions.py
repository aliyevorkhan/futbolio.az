from rest_framework.permissions import BasePermission

from common.enums import AdminRole


class IsAdmin(BasePermission):
    """Any authenticated, active admin (admin or super_admin). Every
    /api/admin/* view must declare this (or IsSuperAdmin) explicitly —
    nothing relies on the frontend hiding a button, per spec section 10.5.
    """

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, "is_active", False))


class IsSuperAdmin(BasePermission):
    """Admin-account management, audit-log-adjacent destructive actions,
    and anything spec section 3/10.4 reserves for the project owner.
    """

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, "is_active", False)
            and getattr(user, "role", None) == AdminRole.SUPER_ADMIN
        )


class CanViewSensitiveFiles(BasePermission):
    """Medic diplomas/certificates are flagged ApplicationFile.is_sensitive
    and spec section 11 restricts them to super_admin or a specially
    permitted admin (AdminUser.can_view_sensitive_files).
    """

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated and getattr(user, "is_active", False)):
            return False
        return user.role == AdminRole.SUPER_ADMIN or getattr(user, "can_view_sensitive_files", False)
