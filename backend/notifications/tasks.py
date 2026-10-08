from celery import shared_task
from django.conf import settings

from .backends import get_backend


@shared_task
def notify_admins_new_application_task(application_id: str, role: str, position: str):
    admin_link = f"{settings.FRONTEND_URL}/admin/applications/{application_id}"
    get_backend().notify_new_application(
        application_id=application_id, role=role, position=position, admin_link=admin_link
    )
