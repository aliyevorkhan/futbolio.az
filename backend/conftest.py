import pytest
from django.core.cache import cache
from rest_framework.test import APIClient


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture(autouse=True)
def _turnstile_bypass(settings):
    settings.TURNSTILE_BYPASS = True


@pytest.fixture(autouse=True)
def _clear_throttle_cache():
    # DRF throttling (and admin login lockout) counters live in the Redis-backed
    # cache, which persists across tests/sessions unlike the transactional DB
    # rollback pytest-django gives us — without this, an earlier test's requests
    # bleed into a later test's rate-limit assertions.
    cache.clear()
    yield
    cache.clear()
