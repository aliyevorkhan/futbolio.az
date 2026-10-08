import logging

import requests
from django.conf import settings

logger = logging.getLogger("futbolio")

SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"


def verify_turnstile(token: str, remote_ip: str) -> bool:
    """Server-side verification of a Cloudflare Turnstile token. Returns
    False (reject) on any missing token, network error, or a negative
    verdict from Cloudflare — fail closed, never fail open.

    TURNSTILE_BYPASS short-circuits to True for local development only; it
    is loudly logged every time it's used so it can never be silently left
    on in a real deployment without someone noticing in the logs.
    """
    if settings.TURNSTILE_BYPASS:
        logger.warning("Turnstile verification bypassed (TURNSTILE_BYPASS=True, dev only)")
        return True

    if not token or not settings.TURNSTILE_SECRET_KEY:
        return False

    try:
        resp = requests.post(
            SITEVERIFY_URL,
            data={
                "secret": settings.TURNSTILE_SECRET_KEY,
                "response": token,
                "remoteip": remote_ip,
            },
            timeout=5,
        )
        resp.raise_for_status()
        return bool(resp.json().get("success"))
    except requests.RequestException:
        logger.exception("Turnstile siteverify call failed")
        return False
