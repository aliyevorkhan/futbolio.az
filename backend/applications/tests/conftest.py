import pytest

from applications.views import CreateApplicationView


@pytest.fixture(autouse=True)
def _no_registration_throttle():
    """Registration's throttle_scope is intentionally tight (5/hour by
    default) for production; several tests in this app submit more than
    that from the same test-client IP in one run, so it's disabled here
    rather than relying on a real Redis-backed cache being reset between
    tests.
    """
    original = CreateApplicationView.throttle_classes
    CreateApplicationView.throttle_classes = []
    yield
    CreateApplicationView.throttle_classes = original
