from django.conf import settings
from django.contrib.auth import login as django_login
from django.contrib.auth import logout as django_logout
from django.middleware.csrf import get_token
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from audit.services import log_event
from common.ip import get_client_ip
from common.permissions import IsSuperAdmin
from common.throttling import AdminLoginThrottle

from .models import AdminPasswordResetToken, AdminUser
from .serializers import (
    AdminUserCreateSerializer,
    AdminUserSerializer,
    LoginSerializer,
    LoginTokenSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    TOTPCodeSerializer,
)
from .services import (
    get_or_create_totp_device,
    issue_password_reset_token,
    provisioning_uri,
    send_password_reset_email,
    send_password_set_email,
    verify_totp_code,
)
from .tokens import read_login_token

GENERIC_LOGIN_ERROR = "Email və ya parol yanlışdır."
LOCKED_ERROR = "Hesab müvəqqəti bloklanıb. Bir az sonra yenidən cəhd edin."
SESSION_EXPIRED_ERROR = "Sessiya bitib, yenidən daxil olun."


@method_decorator(ensure_csrf_cookie, name="get")
class CsrfCookieView(APIView):
    """The frontend calls this once (e.g. on the login page mount) purely to
    receive a csrftoken cookie it can echo back as X-CSRFToken on the
    state-changing calls that follow.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        get_token(request)
        return Response({"detail": "ok"})


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AdminLoginThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        password = serializer.validated_data["password"]
        ip = get_client_ip(request)

        try:
            user = AdminUser.objects.get(email=email)
        except AdminUser.DoesNotExist:
            log_event(actor=None, action="admin.login.failed", target_type="email", target_id=email, ip=ip)
            return Response({"detail": GENERIC_LOGIN_ERROR}, status=status.HTTP_401_UNAUTHORIZED)

        if user.is_locked:
            log_event(
                actor=user,
                action="admin.login.locked",
                target_type="admin_user",
                target_id=str(user.id),
                ip=ip,
            )
            return Response({"detail": LOCKED_ERROR}, status=status.HTTP_423_LOCKED)

        if not user.is_active or not user.check_password(password):
            if user.is_active:
                user.register_failed_attempt(
                    settings.ADMIN_LOGIN_LOCKOUT_THRESHOLD, settings.ADMIN_LOGIN_LOCKOUT_MINUTES
                )
            log_event(
                actor=user,
                action="admin.login.failed",
                target_type="admin_user",
                target_id=str(user.id),
                ip=ip,
            )
            return Response({"detail": GENERIC_LOGIN_ERROR}, status=status.HTTP_401_UNAUTHORIZED)

        user.reset_failed_attempts()
        # 2FA enrollment/verification is disabled — a correct password
        # alone establishes the session now (TOTPEnrollView/TOTPConfirmView/
        # TOTPVerifyView below are unreachable from the login form, kept
        # only so re-enabling 2FA later doesn't need new endpoints).
        django_login(request, user, backend="django.contrib.auth.backends.ModelBackend")
        log_event(
            actor=user,
            action="admin.login.success",
            target_type="admin_user",
            target_id=str(user.id),
            ip=ip,
        )
        return Response(AdminUserSerializer(user).data)


class TOTPEnrollView(APIView):
    """Only reachable mid-login (valid login_token) and only before the
    device has ever been confirmed — once confirmed, re-enrollment must go
    through a super_admin-assisted account reset, not this endpoint.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        admin_id = read_login_token(serializer.validated_data["login_token"])
        if not admin_id:
            return Response({"detail": SESSION_EXPIRED_ERROR}, status=status.HTTP_401_UNAUTHORIZED)

        user = AdminUser.objects.filter(id=admin_id, is_active=True).first()
        if not user:
            return Response({"detail": GENERIC_LOGIN_ERROR}, status=status.HTTP_401_UNAUTHORIZED)

        device = getattr(user, "totp_device", None)
        if device and device.is_confirmed:
            return Response({"detail": "2FA artıq aktivdir."}, status=status.HTTP_400_BAD_REQUEST)

        device = get_or_create_totp_device(user)
        return Response({"secret": device.secret, "provisioning_uri": provisioning_uri(device, user)})


class TOTPConfirmView(APIView):
    """First-time code confirms the device *and* establishes the session —
    no admin session is ever issued without a confirmed TOTP device."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = TOTPCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        admin_id = read_login_token(serializer.validated_data["login_token"])
        if not admin_id:
            return Response({"detail": SESSION_EXPIRED_ERROR}, status=status.HTTP_401_UNAUTHORIZED)

        user = AdminUser.objects.filter(id=admin_id, is_active=True).first()
        device = getattr(user, "totp_device", None) if user else None
        if not user or not device or device.is_confirmed:
            return Response({"detail": GENERIC_LOGIN_ERROR}, status=status.HTTP_401_UNAUTHORIZED)

        if not verify_totp_code(device, serializer.validated_data["code"]):
            return Response({"detail": "Kod yanlışdır."}, status=status.HTTP_401_UNAUTHORIZED)

        device.confirmed_at = timezone.now()
        device.save(update_fields=["confirmed_at"])
        django_login(request, user, backend="django.contrib.auth.backends.ModelBackend")
        log_event(
            actor=user,
            action="admin.login.success",
            target_type="admin_user",
            target_id=str(user.id),
            ip=get_client_ip(request),
        )
        return Response(AdminUserSerializer(user).data)


class TOTPVerifyView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = TOTPCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        admin_id = read_login_token(serializer.validated_data["login_token"])
        ip = get_client_ip(request)
        if not admin_id:
            return Response({"detail": SESSION_EXPIRED_ERROR}, status=status.HTTP_401_UNAUTHORIZED)

        user = AdminUser.objects.filter(id=admin_id, is_active=True).first()
        device = getattr(user, "totp_device", None) if user else None
        if not user or not device or not device.is_confirmed:
            return Response({"detail": GENERIC_LOGIN_ERROR}, status=status.HTTP_401_UNAUTHORIZED)

        if user.is_locked:
            return Response({"detail": LOCKED_ERROR}, status=status.HTTP_423_LOCKED)

        if not verify_totp_code(device, serializer.validated_data["code"]):
            user.register_failed_attempt(
                settings.ADMIN_LOGIN_LOCKOUT_THRESHOLD, settings.ADMIN_LOGIN_LOCKOUT_MINUTES
            )
            log_event(
                actor=user,
                action="admin.login.failed",
                target_type="admin_user",
                target_id=str(user.id),
                ip=ip,
            )
            return Response({"detail": "Kod yanlışdır."}, status=status.HTTP_401_UNAUTHORIZED)

        user.reset_failed_attempts()
        django_login(request, user, backend="django.contrib.auth.backends.ModelBackend")
        log_event(
            actor=user, action="admin.login.success", target_type="admin_user", target_id=str(user.id), ip=ip
        )
        return Response(AdminUserSerializer(user).data)


class LogoutView(APIView):
    def post(self, request):
        log_event(
            actor=request.user,
            action="admin.logout",
            target_type="admin_user",
            target_id=str(request.user.id),
            ip=get_client_ip(request),
        )
        django_logout(request)
        return Response({"detail": "ok"})


class MeView(APIView):
    def get(self, request):
        return Response(AdminUserSerializer(request.user).data)


class PasswordResetRequestView(APIView):
    """Always returns 200 regardless of whether the email exists — spec's
    own duplicate-detection principle applied here too: never confirm or
    deny account existence to an unauthenticated caller.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        user = AdminUser.objects.filter(email=email, is_active=True).first()
        if user:
            token = issue_password_reset_token(user)
            send_password_reset_email(user, token)
        return Response({"detail": "ok"})


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token_value = serializer.validated_data["token"]
        reset_token = (
            AdminPasswordResetToken.objects.select_related("admin").filter(token=token_value).first()
        )
        if not reset_token or not reset_token.is_valid:
            return Response(
                {"detail": "Link etibarsızdır və ya vaxtı bitib."}, status=status.HTTP_400_BAD_REQUEST
            )

        user = reset_token.admin
        user.set_password(serializer.validated_data["new_password"])
        user.must_change_password = False
        user.reset_failed_attempts()
        user.save()
        reset_token.used_at = timezone.now()
        reset_token.save(update_fields=["used_at"])
        log_event(
            actor=user,
            action="admin.password_reset.completed",
            target_type="admin_user",
            target_id=str(user.id),
            ip=get_client_ip(request),
        )
        return Response({"detail": "ok"})


# --- Admin-user management (super_admin only) --------------------------------


class AdminUserListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsSuperAdmin]
    queryset = AdminUser.objects.all()

    def get_serializer_class(self):
        return AdminUserCreateSerializer if self.request.method == "POST" else AdminUserSerializer

    def perform_create(self, serializer):
        user = serializer.save(is_active=True, must_change_password=True)
        user.set_unusable_password()
        user.save(update_fields=["password"])
        token = issue_password_reset_token(user)
        send_password_set_email(user, token)
        log_event(
            actor=self.request.user,
            action="admin.admin_user.created",
            target_type="admin_user",
            target_id=str(user.id),
            ip=get_client_ip(self.request),
            meta={"email": user.email, "role": user.role},
        )


class AdminUserDisableView(APIView):
    permission_classes = [IsSuperAdmin]

    def patch(self, request, pk):
        user = generics.get_object_or_404(AdminUser.objects, pk=pk)
        user.is_active = False
        user.save(update_fields=["is_active"])
        log_event(
            actor=request.user,
            action="admin.admin_user.disabled",
            target_type="admin_user",
            target_id=str(user.id),
            ip=get_client_ip(request),
        )
        return Response(AdminUserSerializer(user).data)


class AdminUserForcePasswordResetView(APIView):
    permission_classes = [IsSuperAdmin]

    def post(self, request, pk):
        user = generics.get_object_or_404(AdminUser.objects, pk=pk)
        token = issue_password_reset_token(user)
        send_password_reset_email(user, token)
        log_event(
            actor=request.user,
            action="admin.admin_user.password_reset_forced",
            target_type="admin_user",
            target_id=str(user.id),
            ip=get_client_ip(request),
        )
        return Response({"detail": "ok"})
