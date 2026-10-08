import threading
import uuid

_request_id_local = threading.local()


def get_current_request_id() -> str:
    return getattr(_request_id_local, "request_id", "-")


class RequestIdLoggingMiddleware:
    """Stamps every request with a short id so log lines for the same request
    (across views, Celery enqueue calls, etc.) can be correlated without
    leaking any personal data into the logs themselves.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _request_id_local.request_id = uuid.uuid4().hex[:12]
        try:
            response = self.get_response(request)
        finally:
            request_id = _request_id_local.request_id
            del _request_id_local.request_id
        response["X-Request-Id"] = request_id
        return response


class SecurityHeadersMiddleware:
    """Adds the headers spec section 10.1 requires beyond what
    django.middleware.security.SecurityMiddleware already covers
    (HSTS/nosniff/SSL-redirect), and strips the Server header's version
    detail so the stack isn't fingerprintable.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response["X-Content-Type-Options"] = "nosniff"
        response["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response["X-Frame-Options"] = "DENY"
        response["Content-Security-Policy"] = (
            "default-src 'self'; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://challenges.cloudflare.com; "
            "script-src 'self' https://challenges.cloudflare.com; "
            "style-src 'self' 'unsafe-inline'"
        )
        if "Server" in response:
            del response["Server"]
        return response
