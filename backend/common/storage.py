"""
Single source of truth for every interaction with the S3-compatible object
store — Hetzner Object Storage, in every environment (local dev and
production both point at the same kind of endpoint; only the bucket/
credentials differ). Nothing elsewhere in the codebase should construct a
boto3 client or call django-storages' `.url()` directly: every link handed
to a browser is a freshly minted, short-lived presigned URL from here, and
the bucket itself is never public (see config/settings.py STORAGES OPTIONS:
default_acl="private", querystring_auth=False).

Hetzner's endpoint is a single publicly-reachable HTTPS host used both by
the backend server and by the browser (unlike a self-hosted, compose-
internal alternative), so there's deliberately only one client builder here
— no separate "internal vs. public endpoint" split needed.
"""

import io
import uuid
from dataclasses import dataclass

import boto3
import magic
from botocore.client import Config as BotoConfig
from django.conf import settings
from PIL import Image

try:
    from pillow_heif import register_heif_opener

    register_heif_opener()
except ImportError:  # pragma: no cover - dev environments without the plugin
    pass


def _client():
    return boto3.client(
        "s3",
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME,
        config=BotoConfig(
            signature_version="s3v4",
            s3={"addressing_style": settings.AWS_S3_ADDRESSING_STYLE},
        ),
    )


BUCKET = settings.AWS_S3_BUCKET

# Allowlists keyed by FileKind — magic-byte detected mime must be in this
# set regardless of what the client declared or what extension was used.
# SVG/HTML/EXE/archives are never accepted no matter the stated kind.
ALLOWED_MIME_BY_KIND = {
    "photo": {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"},
    "video": {"video/mp4", "video/quicktime"},
    "document": {"application/pdf", "image/jpeg", "image/png"},
}

MAX_SIZE_BY_KIND = {
    "photo": settings.MAX_PHOTO_SIZE_BYTES,
    "video": settings.MAX_VIDEO_SIZE_BYTES,
    "document": settings.MAX_DOCUMENT_SIZE_BYTES,
}


def build_object_key(upload_session_id: str, file_id: str, extension: str) -> str:
    ext = extension.lstrip(".").lower()
    return f"uploads/{upload_session_id}/{file_id}.{ext}"


def build_thumbnail_key(file_id: str) -> str:
    return f"thumbnails/{file_id}.jpg"


@dataclass
class PresignedUpload:
    mode: str  # "single" or "multipart"
    key: str
    url: str | None = None
    upload_id: str | None = None
    part_size: int | None = None
    part_urls: list[str] | None = None


def presign_put(key: str, content_type: str, ttl: int | None = None) -> str:
    ttl = ttl or settings.FILE_PRESIGN_UPLOAD_TTL_SECONDS
    return _client().generate_presigned_url(
        "put_object",
        Params={"Bucket": BUCKET, "Key": key, "ContentType": content_type},
        ExpiresIn=ttl,
    )


MULTIPART_PART_SIZE = 25 * 1024 * 1024  # 25MB parts, well above S3's 5MB minimum


def create_multipart_upload(
    key: str, content_type: str, size: int, ttl: int | None = None
) -> PresignedUpload:
    ttl = ttl or settings.FILE_PRESIGN_UPLOAD_TTL_SECONDS
    client = _client()
    created = client.create_multipart_upload(Bucket=BUCKET, Key=key, ContentType=content_type)
    upload_id = created["UploadId"]
    part_count = max(1, -(-size // MULTIPART_PART_SIZE))  # ceil division
    part_urls = [
        client.generate_presigned_url(
            "upload_part",
            Params={
                "Bucket": BUCKET,
                "Key": key,
                "UploadId": upload_id,
                "PartNumber": part_number,
            },
            ExpiresIn=ttl,
        )
        for part_number in range(1, part_count + 1)
    ]
    return PresignedUpload(
        mode="multipart",
        key=key,
        upload_id=upload_id,
        part_size=MULTIPART_PART_SIZE,
        part_urls=part_urls,
    )


def complete_multipart_upload(key: str, upload_id: str, parts: list[dict]) -> None:
    _client().complete_multipart_upload(
        Bucket=BUCKET,
        Key=key,
        UploadId=upload_id,
        MultipartUpload={"Parts": parts},
    )


def head_object(key: str) -> dict | None:
    try:
        return _client().head_object(Bucket=BUCKET, Key=key)
    except Exception:
        return None


def get_object_bytes(key: str, max_bytes: int | None = None) -> bytes:
    """Fetch (optionally truncated) object bytes for server-side inspection
    — magic-byte sniffing only needs the first few KB, not the whole file.
    """
    client = _client()
    if max_bytes:
        obj = client.get_object(Bucket=BUCKET, Key=key, Range=f"bytes=0-{max_bytes - 1}")
    else:
        obj = client.get_object(Bucket=BUCKET, Key=key)
    return obj["Body"].read()


def get_object_stream(key: str):
    return _client().get_object(Bucket=BUCKET, Key=key)["Body"]


def put_object_bytes(key: str, data: bytes, content_type: str) -> None:
    _client().put_object(Bucket=BUCKET, Key=key, Body=data, ContentType=content_type, ACL="private")


def delete_object(key: str) -> None:
    _client().delete_object(Bucket=BUCKET, Key=key)


def presign_get(
    key: str,
    ttl: int | None = None,
    download_filename: str | None = None,
    content_type: str | None = None,
) -> str:
    ttl = ttl or settings.FILE_PRESIGN_VIEW_TTL_SECONDS
    params = {"Bucket": BUCKET, "Key": key}
    if download_filename:
        params["ResponseContentDisposition"] = f'attachment; filename="{download_filename}"'
    if content_type:
        params["ResponseContentType"] = content_type
    return _client().generate_presigned_url("get_object", Params=params, ExpiresIn=ttl)


def presign_get_export(key: str, download_filename: str, content_type: str) -> str:
    return presign_get(
        key,
        ttl=settings.FILE_PRESIGN_EXPORT_TTL_SECONDS,
        download_filename=download_filename,
        content_type=content_type,
    )


def detect_mime_from_bytes(data: bytes) -> str:
    return magic.from_buffer(data, mime=True)


def is_allowed_mime(kind: str, detected_mime: str) -> bool:
    return detected_mime in ALLOWED_MIME_BY_KIND.get(kind, set())


def strip_exif_and_reencode(data: bytes) -> tuple[bytes, str]:
    """Re-encodes an image without any EXIF metadata (GPS included) — Pillow
    only copies pixel data when you build a fresh Image and save it, so
    simply not passing `exif=` on save is sufficient; we go one step
    further and rebuild the image object entirely so no metadata survives
    even implicitly. Returns (new_bytes, mime_type).
    """
    image = Image.open(io.BytesIO(data))
    image.load()
    clean = Image.new(image.mode, image.size)
    clean.putdata(list(image.getdata()))
    buffer = io.BytesIO()
    save_format = "JPEG" if image.format in (None, "HEIC", "HEIF") else image.format
    if save_format == "JPEG" and clean.mode not in ("RGB", "L"):
        clean = clean.convert("RGB")
    clean.save(buffer, format=save_format)
    mime = Image.MIME.get(save_format, "application/octet-stream")
    return buffer.getvalue(), mime


def generate_thumbnail(data: bytes, max_width: int = 400) -> bytes:
    image = Image.open(io.BytesIO(data))
    image.load()
    if image.mode not in ("RGB", "L"):
        image = image.convert("RGB")
    ratio = max_width / float(image.width)
    target_height = int(image.height * ratio) if image.width > max_width else image.height
    target_width = min(image.width, max_width)
    image.thumbnail((target_width, target_height))
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=85)
    return buffer.getvalue()


def new_upload_session_id() -> str:
    return str(uuid.uuid4())
