from rest_framework.throttling import ScopedRateThrottle, SimpleRateThrottle

from common.ip import get_client_ip


class CloudflareAwareScopedRateThrottle(ScopedRateThrottle):
    """Same as DRF's ScopedRateThrottle but keys on the real client IP
    (CF-Connecting-IP behind Cloudflare), not REMOTE_ADDR, which would just
    be Cloudflare's edge IP in production.
    """

    def get_cache_key(self, request, view):
        ident = get_client_ip(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}


class AdminLoginThrottle(SimpleRateThrottle):
    """Keyed on email+IP (not IP alone) so one bad actor can't lock every
    admin at a shared office IP out of attempting to log in, while still
    rate-limiting brute-force attempts against a single account.
    """

    scope = "admin_login"

    def get_cache_key(self, request, view):
        email = (request.data.get("email") or "").strip().lower()
        ip = get_client_ip(request)
        ident = f"{email}:{ip}"
        return self.cache_format % {"scope": self.scope, "ident": ident}
