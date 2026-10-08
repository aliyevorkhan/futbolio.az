"""Shared field validators, reused by both the public registration serializer
and anywhere else the same rule applies. Kept framework-agnostic (plain
RegexValidator/callables) so they can be imported by DRF serializers without
pulling in model-specific concerns.
"""

from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator

# +994 followed by one of the real Azerbaijani mobile operator codes and 7
# more digits. Matches spec section 5's table exactly.
AZ_PHONE_REGEX = r"^\+994(10|50|51|55|60|70|77|99)\d{7}$"

az_phone_validator = RegexValidator(
    regex=AZ_PHONE_REGEX,
    message="Enter a valid Azerbaijani WhatsApp number, e.g. +994501234567.",
)

# Azerbaijani Latin alphabet letters, spaces and hyphens only, 3-80 chars
# (length is enforced separately via max_length/MinLengthValidator so the
# regex itself only polices character set).
FULL_NAME_REGEX = r"^[A-Za-zÇçƏəĞğIıİiÖöŞşÜü\s-]+$"

full_name_validator = RegexValidator(
    regex=FULL_NAME_REGEX,
    message="Name may only contain letters, spaces and hyphens.",
)

# Instagram handle without the leading @: letters, digits, dot, underscore.
INSTAGRAM_HANDLE_REGEX = r"^[A-Za-z0-9_.]{1,30}$"

instagram_handle_validator = RegexValidator(
    regex=INSTAGRAM_HANDLE_REGEX,
    message="Enter an Instagram handle without the leading @.",
)

ALLOWED_VIDEO_LINK_DOMAINS = (
    "instagram.com",
    "www.instagram.com",
    "tiktok.com",
    "www.tiktok.com",
    "youtube.com",
    "www.youtube.com",
    "youtu.be",
    "drive.google.com",
)


def validate_video_link_domain(url: str) -> None:
    from urllib.parse import urlparse

    netloc = urlparse(url).netloc.lower()
    if netloc not in ALLOWED_VIDEO_LINK_DOMAINS:
        raise ValidationError(
            "Video link must be an Instagram, TikTok, YouTube or Google Drive URL."
        )


def validate_age(age: int) -> None:
    if age < 18 or age > 70:
        raise ValidationError("Age must be between 18 and 70.")


def validate_non_empty_list(value: list) -> None:
    if not value:
        raise ValidationError("Select at least one option.")
