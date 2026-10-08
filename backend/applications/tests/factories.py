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
        "date_of_birth": "1999-06-15",
        "phone": "+994501234567",
        "instagram_handle": "anar.quliyev",
        "district": "yasamal",
        "player_details": {
            "main_position": "forward",
            "extra_positions": [],
            "preferred_foot": "right",
            "years_playing": "3_5",
            "club_experience_text": "",
            "experience_level": "amateur",
            "has_pro_experience": False,
            "hourly_rate_azn": 20,
            "is_university_student": False,
        },
        "availability": {
            "time_slots": ["monday:18_21", "wednesday:18_21"],
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


def valid_referee_payload(**overrides):
    upload_session_id = uuid.uuid4()
    photo = make_file(
        upload_session_id, kind=FileKind.PHOTO, original_name="photo.jpg", declared_mime="image/jpeg"
    )
    payload = {
        "role": "referee",
        "full_name": "Rashad Mammadli",
        "date_of_birth": "1995-03-10",
        "phone": "+994551234567",
        "district": "nesimi",
        "referee_details": {
            "has_official_certification": False,
            "certification_name": "",
            "years_refereeing": "3_5",
            "game_types": ["mini_football"],
            "experience_text": "",
        },
        "availability": {
            "time_slots": ["tuesday:09_12"],
            "districts": ["nesimi"],
        },
        "upload_session_id": str(upload_session_id),
        "file_ids": [str(photo.id)],
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


def valid_medic_payload(**overrides):
    upload_session_id = uuid.uuid4()
    photo = make_file(
        upload_session_id, kind=FileKind.PHOTO, original_name="photo.jpg", declared_mime="image/jpeg"
    )
    payload = {
        "role": "medic",
        "full_name": "Günel Hasanova",
        "date_of_birth": "1992-11-02",
        "phone": "+994601234567",
        "district": "sebail",
        "medic_details": {
            "specialty": ["paramedic"],
            "equipment_status": "yes",
            "equipment_missing_text": "",
            "work_experience": "3_5",
            "workplace": "",
        },
        "availability": {
            "time_slots": ["friday:12_15"],
            "districts": ["sebail"],
        },
        "upload_session_id": str(upload_session_id),
        "file_ids": [str(photo.id)],
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
