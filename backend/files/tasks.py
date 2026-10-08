import logging
from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.utils import timezone

from common.clamav import ScanResult, scan_bytes
from common.enums import FileKind, ScanStatus
from common.storage import (
    build_thumbnail_key,
    delete_object,
    detect_mime_from_bytes,
    generate_thumbnail,
    get_object_bytes,
    is_allowed_mime,
    put_object_bytes,
    strip_exif_and_reencode,
)

from .models import ApplicationFile

logger = logging.getLogger("futbolio")


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def process_uploaded_file_task(self, file_id):
    """Post-upload pipeline: magic-byte mime check, ClamAV scan, then (for
    photos) EXIF stripping + thumbnail generation. ClamAV is always on —
    this is the EICAR acceptance-test path (spec section 15): an infected
    upload must end up deleted from storage, not just flagged.
    """
    try:
        file_obj = ApplicationFile.objects.get(id=file_id)
    except ApplicationFile.DoesNotExist:
        return

    data = get_object_bytes(file_obj.storage_key)
    detected_mime = detect_mime_from_bytes(data[:8192])
    file_obj.detected_mime = detected_mime

    if not is_allowed_mime(file_obj.kind, detected_mime):
        # Content doesn't match the claimed kind (renamed .exe/.svg/.html,
        # etc.) — a content problem, not a transient infra one: reject and
        # remove immediately, no retry.
        file_obj.scan_status = ScanStatus.ERROR
        file_obj.scanned_at = timezone.now()
        file_obj.save(update_fields=["detected_mime", "scan_status", "scanned_at"])
        delete_object(file_obj.storage_key)
        return

    scan_status_result, signature = scan_bytes(data)

    if scan_status_result == ScanResult.INFECTED:
        logger.warning("Infected upload detected: file_id=%s signature=%s", file_id, signature)
        file_obj.scan_status = ScanStatus.INFECTED
        file_obj.scanned_at = timezone.now()
        file_obj.save(update_fields=["detected_mime", "scan_status", "scanned_at"])
        delete_object(file_obj.storage_key)
        if file_obj.thumbnail_key:
            delete_object(file_obj.thumbnail_key)
        return

    if scan_status_result == ScanResult.ERROR:
        # ClamAV itself failed/unreachable — an infra problem, worth
        # retrying before giving up and keeping the object around.
        try:
            self.retry(countdown=30)
        except self.MaxRetriesExceededError:
            file_obj.scan_status = ScanStatus.ERROR
            file_obj.scanned_at = timezone.now()
            file_obj.save(update_fields=["detected_mime", "scan_status", "scanned_at"])
        return

    if file_obj.kind == FileKind.PHOTO:
        clean_data, mime = strip_exif_and_reencode(data)
        put_object_bytes(file_obj.storage_key, clean_data, mime)
        thumb = generate_thumbnail(clean_data)
        thumb_key = build_thumbnail_key(file_obj.id)
        put_object_bytes(thumb_key, thumb, "image/jpeg")
        file_obj.thumbnail_key = thumb_key

    file_obj.scan_status = ScanStatus.CLEAN
    file_obj.scanned_at = timezone.now()
    file_obj.save(update_fields=["detected_mime", "scan_status", "scanned_at", "thumbnail_key"])


@shared_task
def purge_abandoned_files_task():
    """Hourly beat task: an ApplicationFile that never got claimed by an
    Application (candidate abandoned the form mid-upload) is garbage after
    FILE_ABANDONED_PURGE_HOURS. Returns the count purged.
    """
    cutoff = timezone.now() - timedelta(hours=settings.FILE_ABANDONED_PURGE_HOURS)
    queryset = ApplicationFile.objects.filter(application__isnull=True, created_at__lt=cutoff)
    count = 0
    for file_obj in queryset:
        delete_object(file_obj.storage_key)
        if file_obj.thumbnail_key:
            delete_object(file_obj.thumbnail_key)
        file_obj.delete()
        count += 1
    return count
