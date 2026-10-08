import uuid

from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.core.validators import MaxValueValidator, MinLengthValidator, MinValueValidator
from django.db import models
from django.db.models import Q

from common.enums import (
    ApplicationRole,
    ApplicationStatus,
    ConsentType,
    District,
    GameType,
    HourSlot,
    LicenseStatus,
    MainPosition,
    MedicSpecialty,
    PreferredFoot,
    Weekday,
    WorkExperience,
    YearsPlaying,
    YearsRefereeing,
)
from common.validators import (
    az_phone_validator,
    full_name_validator,
    instagram_handle_validator,
    validate_age,
    validate_video_link_domain,
)


class Application(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=20, choices=ApplicationRole.choices)
    full_name = models.CharField(
        max_length=80, validators=[MinLengthValidator(3), full_name_validator]
    )
    age = models.PositiveSmallIntegerField(validators=[validate_age])
    phone = models.CharField(max_length=20, validators=[az_phone_validator], db_index=True)
    instagram_handle = models.CharField(
        max_length=30, blank=True, validators=[instagram_handle_validator]
    )
    district = models.CharField(max_length=20, choices=District.choices, db_index=True)
    status = models.CharField(
        max_length=20, choices=ApplicationStatus.choices, default=ApplicationStatus.NEW, db_index=True
    )
    # Admin-facing only — never serialized on a public-facing serializer.
    is_duplicate = models.BooleanField(default=False)
    video_link_url = models.URLField(blank=True, validators=[validate_video_link_domain])
    utm_source = models.CharField(max_length=100, blank=True)
    utm_medium = models.CharField(max_length=100, blank=True)
    utm_campaign = models.CharField(max_length=100, blank=True)
    upload_session_id = models.UUIDField(db_index=True)
    # Internal retention-staging marker for the purge task only — not a
    # general soft-delete flag, so normal querysets never filter on it.
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["district"]),
            models.Index(fields=["role"]),
        ]

    def __str__(self):
        return f"{self.full_name} ({self.role})"


class PlayerDetails(models.Model):
    application = models.OneToOneField(
        Application, on_delete=models.CASCADE, related_name="player_details"
    )
    main_position = models.CharField(max_length=20, choices=MainPosition.choices)
    extra_positions = ArrayField(
        models.CharField(max_length=20, choices=MainPosition.choices), default=list, blank=True
    )
    preferred_foot = models.CharField(max_length=20, choices=PreferredFoot.choices)
    years_playing = models.CharField(max_length=20, choices=YearsPlaying.choices)
    club_experience_text = models.CharField(max_length=500, blank=True)
    self_rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )


class RefereeDetails(models.Model):
    application = models.OneToOneField(
        Application, on_delete=models.CASCADE, related_name="referee_details"
    )
    license_status = models.CharField(max_length=30, choices=LicenseStatus.choices)
    years_refereeing = models.CharField(max_length=20, choices=YearsRefereeing.choices)
    game_types = ArrayField(models.CharField(max_length=20, choices=GameType.choices), default=list)
    experience_text = models.CharField(max_length=500, blank=True)


class MedicDetails(models.Model):
    application = models.OneToOneField(
        Application, on_delete=models.CASCADE, related_name="medic_details"
    )
    specialty = models.CharField(max_length=30, choices=MedicSpecialty.choices)
    first_aid_cert = models.BooleanField()
    work_experience = models.CharField(max_length=20, choices=WorkExperience.choices)
    workplace = models.CharField(max_length=300, blank=True)


class Availability(models.Model):
    application = models.OneToOneField(
        Application, on_delete=models.CASCADE, related_name="availability"
    )
    days = ArrayField(models.CharField(max_length=20, choices=Weekday.choices), default=list)
    hours = ArrayField(models.CharField(max_length=20, choices=HourSlot.choices), default=list)
    districts = ArrayField(models.CharField(max_length=20, choices=District.choices), default=list)

    class Meta:
        constraints = [
            # Defense in depth only — the real min-1 enforcement is in the
            # serializer; these are a DB-level backstop.
            models.CheckConstraint(check=Q(days__len__gt=0), name="availability_days_non_empty"),
            models.CheckConstraint(check=Q(hours__len__gt=0), name="availability_hours_non_empty"),
            models.CheckConstraint(
                check=Q(districts__len__gt=0), name="availability_districts_non_empty"
            ),
        ]


class Consent(models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name="consents")
    type = models.CharField(max_length=30, choices=ConsentType.choices)
    text_version = models.CharField(max_length=20)
    accepted = models.BooleanField()
    accepted_at = models.DateTimeField()
    # Never a raw IP — always common.ip.hash_ip output.
    ip_hash = models.CharField(max_length=64)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["application", "type"], name="unique_consent_type_per_application"
            ),
        ]


class AdminNote(models.Model):
    """Append-only — no update/destroy view ever exposes these."""

    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name="notes")
    admin = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class StatusChange(models.Model):
    application = models.ForeignKey(
        Application, on_delete=models.CASCADE, related_name="status_history"
    )
    from_status = models.CharField(max_length=20, choices=ApplicationStatus.choices)
    to_status = models.CharField(max_length=20, choices=ApplicationStatus.choices)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL
    )
    changed_at = models.DateTimeField(auto_now_add=True)
    reason = models.TextField(blank=True)

    class Meta:
        ordering = ["-changed_at"]
