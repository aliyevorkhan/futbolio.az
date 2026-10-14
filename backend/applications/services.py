"""Flat per-app services module (matches this repo's convention — see
accounts/services.py, audit/services.py, files/services.py,
sitesettings/services.py; there is no `services/` package anywhere).
"""

from django.db.models import Count

from common.enums import ApplicationStatus

from .models import Application

# The 3 admin-panel tabs are a grouping over the real status values, not a
# 4th "waitlist" status some older wording implied — Gözləyir/Pending is
# simply "not yet a final decision" (new/reviewed/contacted/archived),
# Qəbul edildi/Accepted is accepted, Silindi/Deleted (soft-deleted) is
# rejected, reusing the existing status field rather than adding a new
# boolean.
PENDING_STATUSES = [
    ApplicationStatus.NEW,
    ApplicationStatus.REVIEWED,
    ApplicationStatus.CONTACTED,
    ApplicationStatus.ARCHIVED,
]


def canonicalize_phone(raw: str) -> str:
    """Strip everything but digits, strip a 00994/994/leading-0 national
    prefix, return '+994XXXXXXXXX' (or '' if nothing usable remains).
    Mirrors frontend/lib/validation/shared/phone.ts's toCanonicalPhone
    exactly — keep the two in sync. Does not itself enforce the
    operator-code/length shape; callers still run the result through
    az_phone_validator.
    """
    digits = "".join(ch for ch in raw if ch.isdigit())
    if digits.startswith("00994"):
        digits = digits[2:]
    if digits.startswith("994"):
        digits = digits[3:]
    elif digits.startswith("0"):
        digits = digits[1:]
    digits = digits[:9]
    return f"+994{digits}" if digits else ""


def find_duplicate_phone_groups() -> list[dict]:
    """Every group of 2+ applications sharing the same (already-canonical)
    phone — read-only, used by both the report_duplicate_phones
    management command and the admin-facing duplicate-phones endpoint, so
    the two can never disagree. Never deletes or merges anything; a human
    resolves a real conflict via the admin phone-edit endpoint.
    """
    duplicate_phones = (
        Application.objects.values("phone")
        .annotate(count=Count("id"))
        .filter(count__gt=1)
        .values_list("phone", flat=True)
    )
    groups = []
    for phone in duplicate_phones:
        applications = Application.objects.filter(phone=phone).order_by("created_at")
        groups.append(
            {
                "phone": phone,
                "applications": [
                    {
                        "id": str(application.id),
                        "full_name": application.full_name,
                        "role": application.role,
                        "status": application.status,
                        "created_at": application.created_at,
                    }
                    for application in applications
                ],
            }
        )
    return groups


def resolve_restore_status(application) -> str:
    """The status to restore an accepted/rejected application back to
    the pending bucket — its last pending-bucket status from
    StatusChange history ("Bərpa et"/"Gözləyənlərə qaytar" put it back
    where it was, not just always "Yeni"), or NEW if it was accepted or
    rejected straight from creation with no such history.
    """
    last_change = (
        application.status_history.filter(to_status__in=PENDING_STATUSES)
        .order_by("-changed_at")
        .first()
    )
    return last_change.to_status if last_change else ApplicationStatus.NEW
