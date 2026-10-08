import zxcvbn
from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from common.enums import AdminRole

from .models import AdminUser


def _validate_password_strength(password: str) -> None:
    validate_password(password)
    if settings.PASSWORD_HIBP_CHECK_ENABLED:
        _check_hibp(password)
    score = zxcvbn.zxcvbn(password)["score"]
    if score < 3:
        raise serializers.ValidationError("Password is too weak/guessable. Choose a stronger one.")


def _check_hibp(password: str) -> None:  # pragma: no cover - network-optional defense in depth
    import hashlib

    import requests

    sha1 = hashlib.sha1(password.encode()).hexdigest().upper()
    prefix, suffix = sha1[:5], sha1[5:]
    try:
        resp = requests.get(f"https://api.pwnedpasswords.com/range/{prefix}", timeout=3)
        if resp.ok and any(line.split(":")[0] == suffix for line in resp.text.splitlines()):
            raise serializers.ValidationError("This password has appeared in a known data breach.")
    except requests.RequestException:
        pass  # fail open — HIBP is defense-in-depth, never a hard dependency


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)


class LoginTokenSerializer(serializers.Serializer):
    login_token = serializers.CharField()


class TOTPCodeSerializer(serializers.Serializer):
    login_token = serializers.CharField()
    code = serializers.CharField(min_length=6, max_length=6)


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_new_password(self, value):
        _validate_password_strength(value)
        return value


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminUser
        fields = [
            "id",
            "email",
            "full_name",
            "role",
            "can_view_sensitive_files",
            "is_active",
            "must_change_password",
            "last_login",
            "created_at",
        ]
        read_only_fields = fields


class AdminUserCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminUser
        fields = ["email", "full_name", "role", "can_view_sensitive_files"]

    def validate_role(self, value):
        if value not in AdminRole.values:
            raise serializers.ValidationError("Invalid role.")
        return value
