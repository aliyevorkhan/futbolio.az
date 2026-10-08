import logging

from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger("futbolio")


def generic_exception_handler(exc, context):
    """Wraps DRF's default handler so that:
    - Known API exceptions (validation errors, 401/403/404/429, ...) still
      return their normal structured body — these are safe, generic-by-
      construction messages, not stack traces.
    - Anything else (a genuine 500) never leaks details to the client; the
      full exception is logged server-side only, and the client gets one
      fixed generic message.
    """
    response = drf_exception_handler(exc, context)

    if response is not None:
        return response

    request = context.get("request")
    logger.exception(
        "Unhandled exception on %s %s",
        getattr(request, "method", "?"),
        getattr(request, "path", "?"),
        exc_info=exc,
    )
    return Response(
        {"detail": "Daxili server xətası baş verdi. Zəhmət olmasa bir az sonra yenidən cəhd edin."},
        status=500,
    )
