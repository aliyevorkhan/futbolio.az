"""Azerbaijani display labels for enum-coded export columns.

common.enums's own `.label` values are deliberately English/machine-
oriented (the frontend resolves real display text itself via next-intl,
see that module's docstring) — except `District` and
`PlayerExperienceLevel`, which already happen to hold real Azerbaijani
text in their `.label` slot. This module gives every enum-coded export
column the same treatment, mirroring frontend/messages/az.json's
`admin.enums` block exactly. Keep the two in sync if either changes.
"""

from common.enums import (
    ApplicationRole,
    ApplicationStatus,
    District,
    MainPosition,
    MedicSpecialty,
    PlayerExperienceLevel,
)

ROLE_LABELS: dict[str, str] = {
    ApplicationRole.PLAYER: "Futbolçu",
    ApplicationRole.REFEREE: "Hakim",
    ApplicationRole.MEDIC: "Həkim",
}

STATUS_LABELS: dict[str, str] = {
    ApplicationStatus.NEW: "Yeni",
    ApplicationStatus.REVIEWED: "Baxılıb",
    ApplicationStatus.CONTACTED: "Əlaqə saxlanılıb",
    ApplicationStatus.ACCEPTED: "Qəbul edilib",
    ApplicationStatus.REJECTED: "Rədd edilib",
    ApplicationStatus.ARCHIVED: "Arxivləşdirilib",
}

MAIN_POSITION_LABELS: dict[str, str] = {
    MainPosition.GOALKEEPER: "Qapıçı",
    MainPosition.DEFENDER: "Müdafiəçi",
    MainPosition.MIDFIELDER: "Yarımmüdafiəçi",
    MainPosition.FORWARD: "Hücumçu",
}

MEDIC_SPECIALTY_LABELS: dict[str, str] = {
    MedicSpecialty.SPORTS_DOCTOR: "İdman həkimi",
    MedicSpecialty.DOCTOR: "Həkim",
    MedicSpecialty.PARAMEDIC: "Feldşer/Paramedik",
    MedicSpecialty.PHYSIOTHERAPIST: "Fizioterapevt",
    MedicSpecialty.NURSE: "Tibb bacısı",
    MedicSpecialty.FIRST_AID_SPECIALIST: "İlk yardım mütəxəssisi",
}


def district_label(code: str) -> str:
    return District(code).label if code else ""


def role_label(code: str) -> str:
    return ROLE_LABELS.get(code, code) if code else ""


def status_label(code: str) -> str:
    return STATUS_LABELS.get(code, code) if code else ""


def main_position_label(code: str) -> str:
    return MAIN_POSITION_LABELS.get(code, code) if code else ""


def experience_level_label(code: str) -> str:
    return PlayerExperienceLevel(code).label if code else ""


def medic_specialty_label(code: str) -> str:
    return MEDIC_SPECIALTY_LABELS.get(code, code) if code else ""
