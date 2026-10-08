"""
Shared enums (DRF/DB choice values) used across apps.

These are deliberately kept as machine-readable CODES, never localized
labels — the frontend resolves display text itself via next-intl message
keys (e.g. `wizard.districts.yasamal`), so adding Russian/English later never
requires touching these values or anything that stores/compares them.
"""

from django.db import models


class ApplicationRole(models.TextChoices):
    PLAYER = "player", "Player"
    REFEREE = "referee", "Referee"
    MEDIC = "medic", "Medic"


# The 12 real Baku administrative raions. "Qaraçuxur" is deliberately
# excluded — it is a settlement inside Suraxanı raion, not its own
# administrative district, so including it would double-count one area.
class District(models.TextChoices):
    BINEQEDI = "binegedi", "Binəqədi"
    XETAI = "xetai", "Xətai"
    XEZER = "xezer", "Xəzər"
    QARADAG = "qaradag", "Qaradağ"
    NERIMANOV = "nerimanov", "Nərimanov"
    NESIMI = "nesimi", "Nəsimi"
    NIZAMI = "nizami", "Nizami"
    PIRALLAHI = "pirallahi", "Pirallahı"
    SABUNCU = "sabuncu", "Sabunçu"
    SEBAIL = "sebail", "Səbail"
    SURAXANI = "suraxani", "Suraxanı"
    YASAMAL = "yasamal", "Yasamal"


class ApplicationStatus(models.TextChoices):
    NEW = "new", "New"
    REVIEWED = "reviewed", "Reviewed"
    CONTACTED = "contacted", "Contacted"
    ACCEPTED = "accepted", "Accepted"
    REJECTED = "rejected", "Rejected"
    ARCHIVED = "archived", "Archived"


class MainPosition(models.TextChoices):
    GOALKEEPER = "goalkeeper", "Goalkeeper"
    DEFENDER = "defender", "Defender"
    MIDFIELDER = "midfielder", "Midfielder"
    FORWARD = "forward", "Forward"


class PreferredFoot(models.TextChoices):
    RIGHT = "right", "Right"
    LEFT = "left", "Left"
    BOTH = "both", "Both"


class YearsPlaying(models.TextChoices):
    UNDER_1 = "under_1", "< 1 year"
    ONE_TO_THREE = "1_3", "1-3 years"
    THREE_TO_FIVE = "3_5", "3-5 years"
    OVER_FIVE = "over_5", "5+ years"


class LicenseStatus(models.TextChoices):
    LICENSED = "licensed", "Licensed"
    COURSE_COMPLETED = "course_completed", "Course completed"
    EXPERIENCED_UNLICENSED = "experienced_unlicensed", "Experienced, unlicensed"


class YearsRefereeing(models.TextChoices):
    UNDER_1 = "under_1", "< 1 year"
    ONE_TO_THREE = "1_3", "1-3 years"
    THREE_TO_FIVE = "3_5", "3-5 years"
    OVER_FIVE = "over_5", "5+ years"


class GameType(models.TextChoices):
    MINI_FOOTBALL = "mini_football", "Mini football"
    BIG_FOOTBALL = "big_football", "Big football"
    FUTSAL = "futsal", "Futsal"
    TOURNAMENTS = "tournaments", "Tournaments"


class MedicSpecialty(models.TextChoices):
    SPORTS_DOCTOR = "sports_doctor", "Sports doctor"
    DOCTOR = "doctor", "Doctor"
    PARAMEDIC = "paramedic", "Paramedic"
    PHYSIOTHERAPIST = "physiotherapist", "Physiotherapist"
    NURSE = "nurse", "Nurse"


class WorkExperience(models.TextChoices):
    UNDER_1 = "under_1", "< 1 year"
    ONE_TO_THREE = "1_3", "1-3 years"
    THREE_TO_FIVE = "3_5", "3-5 years"
    OVER_FIVE = "over_5", "5+ years"


class Weekday(models.TextChoices):
    MONDAY = "monday", "Monday"
    TUESDAY = "tuesday", "Tuesday"
    WEDNESDAY = "wednesday", "Wednesday"
    THURSDAY = "thursday", "Thursday"
    FRIDAY = "friday", "Friday"
    SATURDAY = "saturday", "Saturday"
    SUNDAY = "sunday", "Sunday"


class HourSlot(models.TextChoices):
    EVENING_18_20 = "18_20", "18:00-20:00"
    EVENING_20_22 = "20_22", "20:00-22:00"
    NIGHT_22_00 = "22_00", "22:00-00:00"
    WEEKEND_DAYTIME = "weekend_daytime", "Weekend daytime"


class FileKind(models.TextChoices):
    PHOTO = "photo", "Photo"
    VIDEO = "video", "Video"
    DOCUMENT = "document", "Document"


class ScanStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    CLEAN = "clean", "Clean"
    INFECTED = "infected", "Infected"
    ERROR = "error", "Error"


class ConsentType(models.TextChoices):
    DATA_PROCESSING = "data_processing", "Data processing"
    SOCIAL_SHARE = "social_share", "Social media sharing"
    AGE_18_CONFIRMATION = "age_18_confirmation", "Age 18+ confirmation"


class AdminRole(models.TextChoices):
    ADMIN = "admin", "Admin"
    SUPER_ADMIN = "super_admin", "Super admin"
