from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.utils import timezone

from common.enums import ApplicationStatus
from files.services import delete_files_for_application

from .models import Application

try:
    from dateutil.relativedelta import relativedelta

    def _retention_cutoff(months: int):
        return timezone.now() - relativedelta(months=months)
except ImportError:  # pragma: no cover - dateutil not installed in this env

    def _retention_cutoff(months: int):
        return timezone.now() - timedelta(days=30 * months)


PURGE_GRACE_PERIOD_DAYS = 30


@shared_task
def purge_expired_applications_task() -> int:
    """Daily retention sweep (spec section 9): stale rejected/archived
    applications are first staged (deleted_at set) and, after a 30-day
    grace window, physically purged along with their uploaded files.
    """
    cutoff = _retention_cutoff(settings.APPLICATION_RETENTION_MONTHS_DEFAULT)
    Application.objects.filter(
        status__in=[ApplicationStatus.REJECTED, ApplicationStatus.ARCHIVED],
        deleted_at__isnull=True,
        updated_at__lt=cutoff,
    ).update(deleted_at=timezone.now())

    purge_cutoff = timezone.now() - timedelta(days=PURGE_GRACE_PERIOD_DAYS)
    purged = 0
    for application in Application.objects.filter(deleted_at__isnull=False, deleted_at__lt=purge_cutoff):
        delete_files_for_application(application)
        application.delete()
        purged += 1
    return purged
