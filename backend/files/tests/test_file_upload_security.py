import socket
import uuid
from unittest.mock import patch

import pytest
from django.conf import settings

from common.clamav import ScanResult
from common.enums import FileKind, ScanStatus
from files.models import ApplicationFile
from files.tasks import process_uploaded_file_task

# clamd's standard EICAR test string — any real antivirus engine must flag
# this; it is not an actual virus.
EICAR_BYTES = rb"X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"

HTML_PAYLOAD = b"<html><body><script>alert(document.cookie)</script></body></html>"


def _clamav_reachable() -> bool:
    try:
        with socket.create_connection((settings.CLAMAV_HOST, settings.CLAMAV_PORT), timeout=1):
            return True
    except OSError:
        return False


@pytest.fixture
def make_file(db):
    def _make(kind=FileKind.DOCUMENT, declared_mime="application/pdf", original_name="test.bin"):
        return ApplicationFile.objects.create(
            upload_session_id=uuid.uuid4(),
            kind=kind,
            storage_key=f"uploads/test-session/{uuid.uuid4()}.bin",
            original_name=original_name,
            declared_mime=declared_mime,
            size=len(EICAR_BYTES),
        )

    return _make


@pytest.mark.django_db
class TestEicarDetection:
    """The product's literal acceptance test (spec section 15): upload the
    EICAR test string and confirm it's caught and the storage object is
    deleted.
    """

    @patch("files.tasks.delete_object")
    @patch("files.tasks.get_object_bytes")
    @patch("files.tasks.detect_mime_from_bytes", return_value="application/pdf")
    @patch("files.tasks.is_allowed_mime", return_value=True)
    @patch("files.tasks.scan_bytes")
    def test_eicar_mocked_clamav(
        self, mock_scan, mock_allowed, mock_detect, mock_get_bytes, mock_delete, make_file
    ):
        mock_scan.return_value = (ScanResult.INFECTED, "Eicar-Test-Signature")
        mock_get_bytes.return_value = EICAR_BYTES
        file_obj = make_file()

        process_uploaded_file_task(str(file_obj.id))

        file_obj.refresh_from_db()
        assert file_obj.scan_status == ScanStatus.INFECTED
        mock_delete.assert_called_once_with(file_obj.storage_key)

    @pytest.mark.skipif(not _clamav_reachable(), reason="ClamAV not reachable in this environment")
    @patch("files.tasks.delete_object")
    @patch("files.tasks.get_object_bytes")
    @patch("files.tasks.detect_mime_from_bytes", return_value="application/pdf")
    @patch("files.tasks.is_allowed_mime", return_value=True)
    def test_eicar_real_clamav(self, mock_allowed, mock_detect, mock_get_bytes, mock_delete, make_file):
        mock_get_bytes.return_value = EICAR_BYTES
        file_obj = make_file()

        process_uploaded_file_task(str(file_obj.id))

        file_obj.refresh_from_db()
        assert file_obj.scan_status == ScanStatus.INFECTED
        mock_delete.assert_called_once_with(file_obj.storage_key)


@pytest.mark.django_db
class TestMimeMismatch:
    """A renamed/disguised file (e.g. HTML/script payload saved as .jpg)
    must be caught by magic-byte sniffing, regardless of declared mime or
    filename extension.
    """

    @patch("files.tasks.delete_object")
    @patch("files.tasks.get_object_bytes")
    def test_html_payload_declared_as_jpg_rejected(self, mock_get_bytes, mock_delete, make_file):
        mock_get_bytes.return_value = HTML_PAYLOAD
        file_obj = make_file(kind=FileKind.PHOTO, declared_mime="image/jpeg", original_name="photo.jpg")

        process_uploaded_file_task(str(file_obj.id))

        file_obj.refresh_from_db()
        assert file_obj.scan_status == ScanStatus.ERROR
        assert file_obj.detected_mime == "text/html"
        mock_delete.assert_called_once_with(file_obj.storage_key)


@pytest.mark.django_db
class TestPresignSizeLimit:
    def test_oversized_document_rejected_before_presign(self, api_client):
        payload = {
            "upload_session_id": str(uuid.uuid4()),
            "kind": "document",
            "filename": "diploma.pdf",
            "content_type": "application/pdf",
            "size": settings.MAX_DOCUMENT_SIZE_BYTES + 1,
            "role": "medic",
        }
        response = api_client.post("/api/public/uploads/presign/", payload, format="json")

        assert response.status_code == 400
        assert not ApplicationFile.objects.exists()

    def test_disallowed_content_type_rejected(self, api_client):
        payload = {
            "upload_session_id": str(uuid.uuid4()),
            "kind": "photo",
            "filename": "photo.svg",
            "content_type": "image/svg+xml",
            "size": 1024,
            "role": "player",
        }
        response = api_client.post("/api/public/uploads/presign/", payload, format="json")

        assert response.status_code == 400
        assert not ApplicationFile.objects.exists()
