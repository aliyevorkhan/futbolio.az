from datetime import date

from django.conf import settings
from django.core.validators import MinLengthValidator
from django.utils import timezone
from rest_framework import serializers

from common.age_limits import ROLE_AGE_LIMIT_MESSAGES, is_age_in_range_for_role
from common.enums import (
    ApplicationRole,
    ApplicationStatus,
    ConsentType,
    District,
    FileKind,
    FirstAidEquipmentStatus,
    GameType,
    HourSlot,
    MainPosition,
    MedicSpecialty,
    PlayerExperienceLevel,
    ScanStatus,
    Weekday,
)
from common.ip import get_client_ip, hash_ip
from common.storage import presign_get
from common.turnstile import verify_turnstile
from common.validators import (
    az_phone_validator,
    full_name_validator,
    instagram_handle_validator,
    validate_non_empty_list,
    validate_video_link_domain,
)
from files.models import ApplicationFile

from .constants import CONSENT_TEXT_VERSION
from .models import (
    AdminNote,
    Application,
    Availability,
    Consent,
    MedicDetails,
    PlayerDetails,
    PlayerProfessionalPeriod,
    RefereeDetails,
    StatusChange,
)
from .services import canonicalize_phone

GENERIC_SUBMISSION_ERROR = "Sorğunu göndərmək mümkün olmadı. Məlumatları yoxlayıb yenidən cəhd edin."
DUPLICATE_PHONE_ERROR = (
    "Bu nömrə ilə artıq qeydiyyat mövcuddur. Məlumatlarını dəyişmək istəyirsənsə, "
    "WhatsApp-dan bizə yaz."
)


def headline_position(application: Application) -> str:
    """The single role-specific field admins scan a list/export by."""
    if application.role == ApplicationRole.PLAYER:
        details = getattr(application, "player_details", None)
        return details.main_position if details else ""
    if application.role == ApplicationRole.REFEREE:
        details = getattr(application, "referee_details", None)
        return details.years_refereeing if details else ""
    if application.role == ApplicationRole.MEDIC:
        details = getattr(application, "medic_details", None)
        return ",".join(details.specialty) if details else ""
    return ""


# --- Shared nested serializers (reused for both public write and admin read) ---


class PlayerProfessionalPeriodSerializer(serializers.Serializer):
    start_year = serializers.IntegerField(min_value=1960, max_value=date.today().year)
    end_year = serializers.IntegerField(min_value=1960, max_value=date.today().year)
    club = serializers.CharField(max_length=120, required=False, allow_blank=True, default="")

    def validate(self, attrs):
        if attrs["start_year"] > attrs["end_year"]:
            raise serializers.ValidationError("start_year must be <= end_year.")
        return attrs


class PlayerDetailsSerializer(serializers.ModelSerializer):
    extra_positions = serializers.ListField(
        child=serializers.ChoiceField(choices=MainPosition.choices), required=False, default=list
    )
    experience_level = serializers.ChoiceField(choices=PlayerExperienceLevel.choices)
    has_pro_experience = serializers.BooleanField()
    hourly_rate_azn = serializers.IntegerField(min_value=1)
    is_university_student = serializers.BooleanField()
    university_name = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")
    course_year = serializers.IntegerField(
        min_value=1, max_value=4, required=False, allow_null=True, default=None
    )
    professional_periods = PlayerProfessionalPeriodSerializer(many=True, required=False, default=list)

    class Meta:
        model = PlayerDetails
        fields = [
            "main_position",
            "extra_positions",
            "preferred_foot",
            "years_playing",
            "club_experience_text",
            "experience_level",
            "has_pro_experience",
            "hourly_rate_azn",
            "is_university_student",
            "university_name",
            "course_year",
            "professional_periods",
        ]


class RefereeDetailsSerializer(serializers.ModelSerializer):
    game_types = serializers.ListField(child=serializers.ChoiceField(choices=GameType.choices))
    has_official_certification = serializers.BooleanField()
    certification_name = serializers.CharField(
        max_length=200, required=False, allow_blank=True, default=""
    )
    certification_link = serializers.URLField(required=False, allow_blank=True, default="")

    class Meta:
        model = RefereeDetails
        fields = [
            "has_official_certification",
            "certification_name",
            "certification_link",
            "years_refereeing",
            "game_types",
            "experience_text",
        ]


class MedicDetailsSerializer(serializers.ModelSerializer):
    specialty = serializers.ListField(
        child=serializers.ChoiceField(choices=MedicSpecialty.choices), validators=[validate_non_empty_list]
    )
    equipment_status = serializers.ChoiceField(choices=FirstAidEquipmentStatus.choices)
    equipment_missing_text = serializers.CharField(
        max_length=500, required=False, allow_blank=True, default=""
    )

    class Meta:
        model = MedicDetails
        fields = ["specialty", "equipment_status", "equipment_missing_text", "work_experience", "workplace"]


class AvailabilitySerializer(serializers.Serializer):
    time_slots = serializers.ListField(
        child=serializers.CharField(), validators=[validate_non_empty_list]
    )
    districts = serializers.ListField(
        child=serializers.ChoiceField(choices=District.choices), validators=[validate_non_empty_list]
    )


class ConsentInputSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=ConsentType.choices)
    accepted = serializers.BooleanField()


class FileListSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationFile
        fields = ["id", "kind", "scan_status"]


class FileDetailSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationFile
        fields = ["id", "kind", "scan_status", "is_sensitive", "original_name"]


# --- Public registration (write-only, atomic) -----------------------------------


class ApplicationCreateSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=ApplicationRole.choices)
    full_name = serializers.CharField(
        max_length=80, validators=[MinLengthValidator(3), full_name_validator]
    )
    # No field-level validator here — the age bound depends on `role`,
    # which isn't known until the whole object is assembled, so the real
    # check lives in validate() below (see common.age_limits).
    date_of_birth = serializers.DateField()
    # No field-level validator — a raw, non-canonical input (e.g.
    # "055 885 07 09") must be normalized before the strict operator-code
    # regex ever runs, which only validate_phone() below can do (DRF runs
    # field-level validators before any validate_<field> hook).
    phone = serializers.CharField(max_length=20)
    instagram_handle = serializers.CharField(
        max_length=30, required=False, allow_blank=True, default="", validators=[instagram_handle_validator]
    )
    district = serializers.ChoiceField(choices=District.choices)

    player_details = PlayerDetailsSerializer(required=False)
    referee_details = RefereeDetailsSerializer(required=False)
    medic_details = MedicDetailsSerializer(required=False)

    video_link_url = serializers.URLField(
        required=False, allow_blank=True, default="", validators=[validate_video_link_domain]
    )
    availability = AvailabilitySerializer()

    upload_session_id = serializers.UUIDField()
    file_ids = serializers.ListField(child=serializers.UUIDField(), required=False, default=list)
    consents = ConsentInputSerializer(many=True)

    utm_source = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    utm_medium = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    utm_campaign = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")

    turnstile_token = serializers.CharField(required=False, allow_blank=True, default="", write_only=True)
    # Honeypot: real users never see or fill this field — any non-blank
    # value means the submitter is an automated client.
    website = serializers.CharField(required=False, allow_blank=True, default="", write_only=True)

    def validate_phone(self, value):
        canonical = canonicalize_phone(value)
        az_phone_validator(canonical)
        if Application.objects.filter(phone=canonical).exists():
            raise serializers.ValidationError(DUPLICATE_PHONE_ERROR)
        return canonical

    def validate(self, attrs):
        request = self.context["request"]

        website = attrs.pop("website", "").strip()
        turnstile_token = attrs.pop("turnstile_token", "")
        if website or not verify_turnstile(turnstile_token, get_client_ip(request)):
            raise serializers.ValidationError(GENERIC_SUBMISSION_ERROR)

        role = attrs["role"]
        details_key = {
            ApplicationRole.PLAYER: "player_details",
            ApplicationRole.REFEREE: "referee_details",
            ApplicationRole.MEDIC: "medic_details",
        }[role]
        if not attrs.get(details_key):
            raise serializers.ValidationError(
                {details_key: ["This field is required for the selected role."]}
            )

        if not is_age_in_range_for_role(role, attrs["date_of_birth"]):
            raise serializers.ValidationError({"date_of_birth": [ROLE_AGE_LIMIT_MESSAGES[role]]})

        if role in (ApplicationRole.REFEREE, ApplicationRole.MEDIC) and attrs.get("instagram_handle"):
            raise serializers.ValidationError(
                {"instagram_handle": ["Instagram is not collected for this role."]}
            )

        if role == ApplicationRole.PLAYER:
            player_data = attrs["player_details"]
            if player_data["has_pro_experience"]:
                if not player_data.get("professional_periods"):
                    raise serializers.ValidationError(
                        {"player_details": {"professional_periods": ["This field is required."]}}
                    )
            else:
                player_data["professional_periods"] = []

            if player_data["is_university_student"]:
                if not player_data.get("university_name", "").strip():
                    raise serializers.ValidationError(
                        {"player_details": {"university_name": ["This field is required."]}}
                    )
                if not player_data.get("course_year"):
                    raise serializers.ValidationError(
                        {"player_details": {"course_year": ["This field is required."]}}
                    )
            else:
                player_data["university_name"] = ""
                player_data["course_year"] = None

        if role == ApplicationRole.REFEREE:
            ref_data = attrs["referee_details"]
            if not ref_data["has_official_certification"]:
                ref_data["certification_name"] = ""
                ref_data["certification_link"] = ""

        if role == ApplicationRole.MEDIC:
            medic_data = attrs["medic_details"]
            if medic_data["equipment_status"] == FirstAidEquipmentStatus.PARTIAL and not medic_data.get(
                "equipment_missing_text", ""
            ).strip():
                raise serializers.ValidationError(
                    {"medic_details": {"equipment_missing_text": ["This field is required."]}}
                )

        for entry in attrs["availability"]["time_slots"]:
            parts = entry.split(":")
            if len(parts) != 2 or parts[0] not in Weekday.values or parts[1] not in HourSlot.values:
                raise serializers.ValidationError(
                    {"availability": {"time_slots": [f"'{entry}' is not a valid time slot."]}}
                )

        consents = attrs["consents"]
        consent_by_type = {c["type"]: c["accepted"] for c in consents}
        required_types = {
            ConsentType.DATA_PROCESSING,
            ConsentType.SOCIAL_SHARE,
            ConsentType.AGE_18_CONFIRMATION,
        }
        if set(consent_by_type.keys()) != required_types:
            raise serializers.ValidationError({"consents": ["All three consent types must be provided."]})
        if not consent_by_type[ConsentType.DATA_PROCESSING] or not consent_by_type[
            ConsentType.AGE_18_CONFIRMATION
        ]:
            raise serializers.ValidationError(
                {"consents": ["Data processing and age 18+ consents must be accepted."]}
            )

        file_ids = attrs.pop("file_ids", [])
        upload_session_id = attrs["upload_session_id"]
        resolved_files = list(
            ApplicationFile.objects.filter(
                id__in=file_ids, upload_session_id=upload_session_id, application__isnull=True
            )
        )
        if len(resolved_files) != len(set(file_ids)):
            raise serializers.ValidationError(
                {"file_ids": ["One or more files could not be found for this upload session."]}
            )

        files_by_kind: dict[str, list] = {}
        for file in resolved_files:
            files_by_kind.setdefault(file.kind, []).append(file)

        if len(files_by_kind.get(FileKind.PHOTO, [])) != 1:
            raise serializers.ValidationError({"file_ids": ["Exactly one photo is required."]})

        video_count = len(files_by_kind.get(FileKind.VIDEO, []))
        video_link_url = attrs.get("video_link_url", "")

        if role == ApplicationRole.PLAYER:
            if video_count > 3:
                raise serializers.ValidationError({"file_ids": ["At most 3 videos are allowed."]})
            if video_count < 1 and not video_link_url:
                raise serializers.ValidationError(
                    {"file_ids": ["Provide 1-3 videos or a video link."]}
                )
        elif role == ApplicationRole.REFEREE:
            # Referee submissions no longer collect video at all.
            if video_count > 0:
                raise serializers.ValidationError(
                    {"file_ids": ["Video is not accepted for the referee role."]}
                )
            document_count = len(files_by_kind.get(FileKind.DOCUMENT, []))
            if document_count > 1:
                raise serializers.ValidationError(
                    {"file_ids": ["At most 1 certificate document is allowed."]}
                )
            ref_data = attrs["referee_details"]
            if ref_data["has_official_certification"] and not (
                ref_data.get("certification_name", "").strip()
                or ref_data.get("certification_link", "").strip()
                or document_count >= 1
            ):
                raise serializers.ValidationError(
                    {
                        "referee_details": {
                            "certification_name": [
                                "Provide a certificate name, link, or document."
                            ]
                        }
                    }
                )
        elif role == ApplicationRole.MEDIC:
            document_count = len(files_by_kind.get(FileKind.DOCUMENT, []))
            if document_count < 1:
                raise serializers.ValidationError(
                    {"file_ids": ["A diploma or certificate document is required."]}
                )
            if document_count > 3:
                raise serializers.ValidationError({"file_ids": ["At most 3 documents are allowed."]})

        attrs["_resolved_files"] = resolved_files
        return attrs

    def create(self, validated_data):
        request = self.context["request"]

        resolved_files = validated_data.pop("_resolved_files")
        player_details_data = validated_data.pop("player_details", None)
        referee_details_data = validated_data.pop("referee_details", None)
        medic_details_data = validated_data.pop("medic_details", None)
        availability_data = validated_data.pop("availability")
        consents_data = validated_data.pop("consents")

        role = validated_data["role"]

        # validate_phone() below already guarantees no other application
        # has this (canonical) phone, so this can never be True for a new
        # row anymore — the column itself stays for historical rows.
        application = Application.objects.create(is_duplicate=False, **validated_data)

        headline = ""
        if role == ApplicationRole.PLAYER and player_details_data:
            periods_data = player_details_data.pop("professional_periods", [])
            details = PlayerDetails.objects.create(application=application, **player_details_data)
            PlayerProfessionalPeriod.objects.bulk_create(
                [PlayerProfessionalPeriod(player_details=details, **p) for p in periods_data]
            )
            headline = details.main_position
        elif role == ApplicationRole.REFEREE and referee_details_data:
            details = RefereeDetails.objects.create(application=application, **referee_details_data)
            headline = details.years_refereeing
        elif role == ApplicationRole.MEDIC and medic_details_data:
            details = MedicDetails.objects.create(application=application, **medic_details_data)
            headline = ",".join(details.specialty)

        Availability.objects.create(application=application, **availability_data)

        ip_hash = hash_ip(get_client_ip(request))
        now = timezone.now()
        for consent in consents_data:
            Consent.objects.create(
                application=application,
                type=consent["type"],
                text_version=CONSENT_TEXT_VERSION,
                accepted=consent["accepted"],
                accepted_at=now,
                ip_hash=ip_hash,
            )

        for file in resolved_files:
            file.application = application
            file.save(update_fields=["application"])

        application._headline_position = headline
        return application


# --- Admin-facing read/write serializers ----------------------------------------


class ApplicationListSerializer(serializers.ModelSerializer):
    files = FileListSummarySerializer(many=True, read_only=True)
    position = serializers.SerializerMethodField()
    level = serializers.SerializerMethodField()
    photo_thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            "id",
            "full_name",
            "role",
            "date_of_birth",
            "district",
            "phone",
            "status",
            "created_at",
            "is_duplicate",
            "position",
            "level",
            "files",
            "photo_thumbnail_url",
        ]

    def get_position(self, obj):
        return headline_position(obj)

    def get_level(self, obj):
        # Player-only, per spec section 2's list columns ("mövqe və
        # səviyyə") — referee/medic have no equivalent single level field.
        details = getattr(obj, "player_details", None)
        return details.experience_level if details else ""

    def get_photo_thumbnail_url(self, obj):
        photo = next(
            (f for f in obj.files.all() if f.kind == FileKind.PHOTO and f.scan_status == ScanStatus.CLEAN),
            None,
        )
        if not photo:
            return None
        key = photo.thumbnail_key or photo.storage_key
        return presign_get(key, ttl=settings.FILE_PRESIGN_LIST_THUMBNAIL_TTL_SECONDS)


class ConsentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consent
        fields = ["type", "text_version", "accepted", "accepted_at"]


class StatusChangeSerializer(serializers.ModelSerializer):
    changed_by_email = serializers.SerializerMethodField()

    class Meta:
        model = StatusChange
        fields = ["from_status", "to_status", "changed_by_email", "changed_at", "reason"]

    def get_changed_by_email(self, obj):
        return obj.changed_by.email if obj.changed_by_id else None


class AdminNoteSerializer(serializers.ModelSerializer):
    admin_email = serializers.SerializerMethodField()

    class Meta:
        model = AdminNote
        fields = ["id", "text", "admin_email", "created_at"]

    def get_admin_email(self, obj):
        return obj.admin.email


class AdminNoteCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminNote
        fields = ["id", "text", "created_at"]
        read_only_fields = ["id", "created_at"]


class ApplicationDetailSerializer(serializers.ModelSerializer):
    player_details = PlayerDetailsSerializer(read_only=True)
    referee_details = RefereeDetailsSerializer(read_only=True)
    medic_details = MedicDetailsSerializer(read_only=True)
    availability = AvailabilitySerializer(read_only=True)
    consents = ConsentSerializer(many=True, read_only=True)
    files = FileDetailSummarySerializer(many=True, read_only=True)
    status_history = StatusChangeSerializer(many=True, read_only=True)
    notes = AdminNoteSerializer(many=True, read_only=True)

    class Meta:
        model = Application
        fields = [
            "id",
            "role",
            "full_name",
            "date_of_birth",
            "phone",
            "instagram_handle",
            "district",
            "status",
            "is_duplicate",
            "video_link_url",
            "utm_source",
            "utm_medium",
            "utm_campaign",
            "upload_session_id",
            "created_at",
            "updated_at",
            "player_details",
            "referee_details",
            "medic_details",
            "availability",
            "consents",
            "files",
            "status_history",
            "notes",
        ]


class PhoneInputSerializer(serializers.Serializer):
    """Shared shape for the public phone-availability check and the admin
    phone-edit endpoint — canonicalizes then re-runs the strict operator
    regex. Each caller does its own duplicate-exists() check (the admin
    edit excludes the record being edited, the public check doesn't)."""

    phone = serializers.CharField(max_length=20)

    def validate_phone(self, value):
        canonical = canonicalize_phone(value)
        az_phone_validator(canonical)
        return canonical


class StatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=ApplicationStatus.choices)
    reason = serializers.CharField(required=False, allow_blank=True, default="")
