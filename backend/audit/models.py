import uuid

from django.conf import settings
from django.db import models


class AuditLogEntry(models.Model):
    """Immutable forensic log (spec section 10.5: login, application view,
    status change, export, delete, admin-account creation — retained 1
    year, admins cannot delete it). `target_type`/`target_id` are a plain
    string reference rather than a GenericForeignKey so an entry survives
    the target being hard-deleted later (e.g. "an application was deleted"
    must remain readable after the application itself is gone).

    No view/serializer in this app ever exposes a delete action for this
    model — that is enforced by simply never routing one, not by
    permission checks alone.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_entries",
    )
    action = models.CharField(max_length=100, db_index=True)
    target_type = models.CharField(max_length=50, blank=True)
    target_id = models.CharField(max_length=64, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["target_type", "target_id"])]

    def __str__(self):
        return f"{self.action} by {self.actor_id} @ {self.created_at:%Y-%m-%d %H:%M}"
