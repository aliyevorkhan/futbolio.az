import hashlib

from django.conf import settings


def get_client_ip(request) -> str:
    """Cloudflare terminates TLS in front of this app, so the real client IP
    arrives in CF-Connecting-IP; fall back to X-Forwarded-For (first hop)
    and finally REMOTE_ADDR for local/dev requests that bypass Cloudflare.
    """
    cf_ip = request.META.get("HTTP_CF_CONNECTING_IP")
    if cf_ip:
        return cf_ip.strip()
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "0.0.0.0")


def hash_ip(ip: str) -> str:
    """One-way hash used for candidate consent records (spec section 11) —
    the raw IP is never stored for a candidate's consent, only this hash,
    salted with the Django secret so it can't be rainbow-tabled externally.
    """
    salted = f"{settings.IP_HASH_SALT}:{ip}".encode()
    return hashlib.sha256(salted).hexdigest()
