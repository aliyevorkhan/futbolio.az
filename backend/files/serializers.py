from rest_framework import serializers

from common.enums import ApplicationRole, FileKind
from common.storage import MAX_SIZE_BY_KIND

# Loose pre-check only — the real validation happens post-upload via magic
# bytes in tasks.process_uploaded_file_task. This just rejects content types
# that are never acceptable regardless of claimed kind.
_DISALLOWED_CONTENT_TYPES = {
    "text/html",
    "image/svg+xml",
    "application/x-msdownload",
}


def _is_disallowed_content_type(content_type: str) -> bool:
    content_type = content_type.lower()
    if content_type in _DISALLOWED_CONTENT_TYPES:
        return True
    return content_type.startswith("application/zip") or content_type.startswith("application/x-")


class PresignRequestSerializer(serializers.Serializer):
    upload_session_id = serializers.UUIDField()
    kind = serializers.ChoiceField(choices=FileKind.choices)
    filename = serializers.CharField(max_length=255)
    content_type = serializers.CharField(max_length=100)
    size = serializers.IntegerField(min_value=1)
    role = serializers.ChoiceField(choices=ApplicationRole.choices, required=False, allow_null=True)

    def validate_content_type(self, value):
        if _is_disallowed_content_type(value):
            raise serializers.ValidationError("This content type is not allowed.")
        return value

    def validate(self, attrs):
        max_size = MAX_SIZE_BY_KIND[attrs["kind"]]
        if attrs["size"] > max_size:
            raise serializers.ValidationError({"size": "File exceeds the maximum size for this kind."})
        return attrs


class UploadPartSerializer(serializers.Serializer):
    part_number = serializers.IntegerField(min_value=1)
    etag = serializers.CharField()


class UploadCompleteSerializer(serializers.Serializer):
    parts = UploadPartSerializer(many=True, required=False, default=list)
