import uuid

from django.db import models

from common.enums import FileKind, ScanStatus


class ApplicationFile(models.Model):
    """One uploaded candidate file (photo/video/document). Rows are created
    at presign time with `application=None` — the `applications` app claims
    them (by id + upload_session_id) when the candidate submits the form, so
    this app must never set `.application` itself.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(
        "applications.Application",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="files",
    )
    upload_session_id = models.UUIDField(db_index=True)
    kind = models.CharField(max_length=20, choices=FileKind.choices)
    storage_key = models.CharField(max_length=255)
    original_name = models.CharField(max_length=255)
    declared_mime = models.CharField(max_length=100)
    detected_mime = models.CharField(max_length=100, blank=True)
    size = models.PositiveIntegerField()
    scan_status = models.CharField(
        max_length=20, choices=ScanStatus.choices, default=ScanStatus.PENDING, db_index=True
    )
    # Medic diplomas/certs only (spec section 11) — gates admin view access
    # via common.permissions.CanViewSensitiveFiles.
    is_sensitive = models.BooleanField(default=False)
    thumbnail_key = models.CharField(max_length=255, blank=True)
    multipart_upload_id = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(null=True, blank=True)
    scanned_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["upload_session_id"])]

    def __str__(self):
        return f"{self.original_name} ({self.kind})"
