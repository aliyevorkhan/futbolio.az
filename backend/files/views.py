import uuid

from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from audit.services import log_event
from common.enums import ApplicationRole, FileKind
from common.ip import get_client_ip
from common.permissions import CanViewSensitiveFiles, IsAdmin
from common.storage import (
    build_object_key,
    complete_multipart_upload,
    create_multipart_upload,
    presign_get,
    presign_put,
)
from common.throttling import CloudflareAwareScopedRateThrottle

from .models import ApplicationFile
from .serializers import PresignRequestSerializer, UploadCompleteSerializer
from .tasks import process_uploaded_file_task

# Above this, use a multipart upload (large videos); at/below it, a single
# presigned PUT is simpler and sufficient.
MULTIPART_THRESHOLD_BYTES = 20 * 1024 * 1024


def _extension_from(filename: str) -> str:
    return filename.rsplit(".", 1)[-1] if "." in filename else "bin"


class UploadPresignView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [CloudflareAwareScopedRateThrottle]
    throttle_scope = "upload_presign"

    def post(self, request):
        serializer = PresignRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        file_id = uuid.uuid4()
        storage_key = build_object_key(
            str(data["upload_session_id"]), str(file_id), _extension_from(data["filename"])
        )
        is_sensitive = data["kind"] == FileKind.DOCUMENT and data.get("role") == ApplicationRole.MEDIC

        file_obj = ApplicationFile(
            id=file_id,
            upload_session_id=data["upload_session_id"],
            kind=data["kind"],
            storage_key=storage_key,
            original_name=data["filename"],
            declared_mime=data["content_type"],
            size=data["size"],
            is_sensitive=is_sensitive,
        )

        if data["size"] <= MULTIPART_THRESHOLD_BYTES:
            url = presign_put(storage_key, data["content_type"])
            file_obj.save()
            return Response({"mode": "single", "file_id": str(file_id), "url": url})

        upload = create_multipart_upload(storage_key, data["content_type"], data["size"])
        file_obj.multipart_upload_id = upload.upload_id
        file_obj.save()
        return Response(
            {
                "mode": "multipart",
                "file_id": str(file_id),
                "upload_id": upload.upload_id,
                "part_size": upload.part_size,
                "part_urls": upload.part_urls,
            }
        )


class UploadCompleteView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, file_id):
        # Never distinguish "doesn't exist" from "already claimed by an
        # application" to a caller who doesn't already hold this file_id.
        file_obj = ApplicationFile.objects.filter(id=file_id, application__isnull=True).first()
        if not file_obj:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = UploadCompleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        parts = serializer.validated_data.get("parts") or []

        if file_obj.multipart_upload_id:
            complete_multipart_upload(
                file_obj.storage_key,
                file_obj.multipart_upload_id,
                [{"PartNumber": p["part_number"], "ETag": p["etag"]} for p in parts],
            )

        file_obj.uploaded_at = timezone.now()
        file_obj.save(update_fields=["uploaded_at"])
        process_uploaded_file_task.delay(str(file_obj.id))
        return Response({"status": "pending_verification", "file_id": str(file_obj.id)})


class ApplicationFileURLView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, application_id, file_id):
        file_obj = get_object_or_404(ApplicationFile, id=file_id, application_id=application_id)
        if file_obj.is_sensitive and not CanViewSensitiveFiles().has_permission(request, self):
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        url = presign_get(
            file_obj.storage_key,
            ttl=settings.FILE_PRESIGN_VIEW_TTL_SECONDS,
            download_filename=file_obj.original_name,
            content_type=file_obj.detected_mime or file_obj.declared_mime,
        )
        log_event(
            actor=request.user,
            action="admin.file.viewed",
            target_type="application_file",
            target_id=str(file_obj.id),
            ip=get_client_ip(request),
        )
        return Response(
            {
                "url": url,
                "scan_status": file_obj.scan_status,
                "original_name": file_obj.original_name,
                "kind": file_obj.kind,
            }
        )
