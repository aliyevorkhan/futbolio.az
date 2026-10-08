import os

from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("futbolio")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

app.conf.task_routes = {
    "files.tasks.*": {"queue": "media"},
    "notifications.tasks.*": {"queue": "default"},
    "applications.tasks.*": {"queue": "default"},
    "audit.tasks.*": {"queue": "default"},
}

app.conf.beat_schedule = {
    "purge-abandoned-files-hourly": {
        "task": "files.tasks.purge_abandoned_files_task",
        "schedule": crontab(minute=0),
    },
    "purge-expired-applications-daily": {
        "task": "applications.tasks.purge_expired_applications_task",
        "schedule": crontab(minute=0, hour=3),
    },
    "purge-old-audit-entries-monthly": {
        "task": "audit.tasks.purge_old_audit_entries_task",
        "schedule": crontab(minute=0, hour=4, day_of_month=1),
    },
}
