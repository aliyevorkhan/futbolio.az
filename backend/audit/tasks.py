from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.utils import timezone

from .models import AuditLogEntry


@shared_task
def purge_old_audit_entries_task():
    """A configurable retention FLOOR, not an admin-triggerable delete —
    there is no API route that lets any admin remove an entry; this beat
    task is the only thing that ever does, and only once an entry is far
    past the retention window (default 12 months, spec section 10.5).
    """
    cutoff = timezone.now() - timedelta(days=30 * settings.AUDIT_LOG_RETENTION_MONTHS)
    deleted_count, _ = AuditLogEntry.objects.filter(created_at__lt=cutoff).delete()
    return deleted_count
