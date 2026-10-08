import pytest
from django.conf import settings
from django.core.management import call_command

from common.storage import _client


def _storage_reachable() -> bool:
    try:
        _client().list_buckets()
        return True
    except Exception:
        return False


@pytest.mark.skipif(not _storage_reachable(), reason="Object storage not reachable in this environment")
def test_configure_storage_cors_applies_policy():
    call_command("configure_storage_cors")
    cors = _client().get_bucket_cors(Bucket=settings.AWS_S3_BUCKET)
    rule = cors["CORSRules"][0]
    assert set(settings.CORS_ALLOWED_ORIGINS).issubset(set(rule["AllowedOrigins"]))
    assert "ETag" in rule["ExposeHeaders"]
    assert "PUT" in rule["AllowedMethods"]
