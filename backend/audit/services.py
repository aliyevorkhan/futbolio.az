from .models import AuditLogEntry


def log_event(
    *,
    actor,
    action: str,
    target_type: str = "",
    target_id: str = "",
    ip: str | None = None,
    meta: dict | None = None,
) -> AuditLogEntry:
    """Single write-point for the audit log — every app that needs to
    record something (accounts, applications, files) imports this instead
    of touching AuditLogEntry directly, so the log's shape never drifts.
    `actor` may be None (e.g. a failed login attempt against a nonexistent
    account, or a public registration event with no admin involved).
    """
    return AuditLogEntry.objects.create(
        actor=actor if (actor is not None and getattr(actor, "is_authenticated", True)) else None,
        action=action,
        target_type=target_type,
        target_id=str(target_id) if target_id else "",
        ip_address=ip or None,
        metadata=meta or {},
    )
