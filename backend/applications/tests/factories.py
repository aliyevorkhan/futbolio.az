import uuid

from accounts.models import AdminUser
from common.enums import AdminRole, FileKind
from files.models import ApplicationFile


def make_file(upload_session_id, kind=FileKind.PHOTO, **overrides):
    defaults = dict(
        upload_session_id=upload_session_id,
        kind=kind,
        storage_key=f"uploads/{upload_session_id}/{uuid.uuid4()}.bin",
        original_name="file.bin",
        declared_mime="application/octet-stream",
        size=1024,
    )
    defaults.update(overrides)
    return ApplicationFile.objects.create(**defaults)


def valid_player_payload(**overrides):
    upload_session_id = uuid.uuid4()
    photo = make_file(
        upload_session_id, kind=FileKind.PHOTO, original_name="photo.jpg", declared_mime="image/jpeg"
    )
    video = make_file(
        upload_session_id, kind=FileKind.VIDEO, original_name="video.mp4", declared_mime="video/mp4"
    )
    payload = {
        "role": "player",
        "full_name": "Anar Quliyev",
        "age": 25,
        "phone": "+994501234567",
        "instagram_handle": "anar.quliyev",
        "district": "yasamal",
        "player_details": {
            "main_position": "forward",
            "extra_positions": [],
            "preferred_foot": "right",
            "years_playing": "3_5",
            "club_experience_text": "",
            "self_rating": 4,
        },
        "availability": {
            "days": ["monday", "wednesday"],
            "hours": ["18_20"],
            "districts": ["yasamal"],
        },
        "upload_session_id": str(upload_session_id),
        "file_ids": [str(photo.id), str(video.id)],
        "consents": [
            {"type": "data_processing", "accepted": True},
            {"type": "social_share", "accepted": False},
            {"type": "age_18_confirmation", "accepted": True},
        ],
        "turnstile_token": "bypass",
        "website": "",
    }
    payload.update(overrides)
    return payload


def make_admin(email="admin@futbolio.az", role=AdminRole.ADMIN):
    return AdminUser.objects.create_user(
        email=email, password="correct-horse-battery-staple-99", role=role, is_active=True
    )
