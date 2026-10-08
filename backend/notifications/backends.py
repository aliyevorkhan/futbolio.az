"""Pluggable notification backends. Only `name+role+position+admin-link` is
ever passed to a backend — never phone, photos, or documents (spec section
13) — so the abstraction's call signature itself makes that leak
structurally hard to introduce later.

ConsoleBackend is the default and logs the summary server-side. A Telegram
backend is architected here but not wired to a real bot token yet (none
exists); dropping one in later is a `NOTIFICATIONS_BACKEND=telegram` env
change plus filling in TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID — no call-site
changes required.
"""

import logging

import requests
from django.conf import settings

logger = logging.getLogger("futbolio")


class NotificationBackend:
    def notify_new_application(
        self, *, application_id: str, role: str, position: str, admin_link: str
    ) -> None:
        raise NotImplementedError


class ConsoleBackend(NotificationBackend):
    def notify_new_application(
        self, *, application_id: str, role: str, position: str, admin_link: str
    ) -> None:
        logger.info(
            "New application %s role=%s position=%s link=%s", application_id, role, position, admin_link
        )


class TelegramBackend(NotificationBackend):
    def notify_new_application(
        self, *, application_id: str, role: str, position: str, admin_link: str
    ) -> None:
        if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_CHAT_ID:
            logger.warning("TelegramBackend selected but TELEGRAM_BOT_TOKEN/CHAT_ID are blank — skipping")
            return
        text = f"Yeni müraciət: {role} / {position}\n{admin_link}"
        url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
        try:
            requests.post(url, data={"chat_id": settings.TELEGRAM_CHAT_ID, "text": text}, timeout=5)
        except requests.RequestException:
            logger.exception("Telegram notification failed for application %s", application_id)


def get_backend() -> NotificationBackend:
    return {"console": ConsoleBackend, "telegram": TelegramBackend}.get(
        settings.NOTIFICATIONS_BACKEND, ConsoleBackend
    )()
