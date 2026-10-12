"""Shared field validators, reused by both the public registration serializer
and anywhere else the same rule applies. Kept framework-agnostic (plain
RegexValidator/callables) so they can be imported by DRF serializers without
pulling in model-specific concerns.
"""

from datetime import date

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

def validate_video_link_domain(url: str) -> None:
    """Accepts any well-formed http(s) URL — not restricted to a domain
    allowlist, per the owner's explicit instruction that any valid video
    link should be accepted."""
    from urllib.parse import urlparse

    scheme = urlparse(url).scheme.lower()
    if scheme not in ("http", "https"):
        raise ValidationError("Enter a valid video link starting with http:// or https://.")


MIN_AGE = 18
MAX_AGE = 45


def validate_date_of_birth(dob: date) -> None:
    today = date.today()
    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    if age < MIN_AGE or age > MAX_AGE:
        raise ValidationError("Qeydiyyat 18-45 yaş arası şəxslər üçündür.")


def validate_non_empty_list(value: list) -> None:
    if not value:
        raise ValidationError("Select at least one option.")
