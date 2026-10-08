"""ClamAV integration — always on (spec section 10.3; the EICAR acceptance
test in section 15 requires this to actually catch and reject a test virus
string, not just exist as architecture). Talks to the `clamav` compose
service over its network socket (clamd), scanning bytes already fetched
from object storage rather than streaming through disk.
"""

import logging

import clamd
from django.conf import settings

logger = logging.getLogger("futbolio")


class ScanResult:
    CLEAN = "clean"
    INFECTED = "infected"
    ERROR = "error"


def scan_bytes(data: bytes) -> tuple[str, str | None]:
    """Returns (ScanResult, signature_name_or_None)."""
    try:
        client = clamd.ClamdNetworkSocket(host=settings.CLAMAV_HOST, port=settings.CLAMAV_PORT, timeout=30)
        result = client.instream(__import__("io").BytesIO(data))
        status, signature = result.get("stream", ("ERROR", None))
        if status == "OK":
            return ScanResult.CLEAN, None
        if status == "FOUND":
            return ScanResult.INFECTED, signature
        return ScanResult.ERROR, None
    except Exception:
        logger.exception("ClamAV scan failed")
        return ScanResult.ERROR, None
