import uuid
from unittest.mock import patch

import pytest


def _presign_payload():
    return {
        "upload_session_id": str(uuid.uuid4()),
        "kind": "photo",
        "filename": "photo.jpg",
        "content_type": "image/jpeg",
        "size": 1024,
        "role": "player",
    }


@pytest.mark.django_db
def test_presign_throttled_after_limit_per_minute(api_client, settings):
    limit = settings.RATE_LIMIT_UPLOAD_LINK_PER_MINUTE

    with patch("files.views.presign_put", return_value="https://example.com/put"):
        for _ in range(limit):
            response = api_client.post("/api/public/uploads/presign/", _presign_payload(), format="json")
            assert response.status_code == 200

        response = api_client.post("/api/public/uploads/presign/", _presign_payload(), format="json")

    assert response.status_code == 429
