"""Per-role registration age bounds — the single source of truth on the
backend. Mirrored in frontend/lib/validation/shared/dateOfBirth.ts; keep
both in sync if these ever change.
"""

from datetime import date

from common.enums import ApplicationRole

AGE_LIMITS: dict[str, tuple[int, int]] = {
    ApplicationRole.PLAYER: (18, 45),
    ApplicationRole.REFEREE: (18, 55),
    ApplicationRole.MEDIC: (18, 75),
}

ROLE_AGE_LIMIT_MESSAGES: dict[str, str] = {
    ApplicationRole.PLAYER: "Futbolçu qeydiyyatı 18-45 yaş arası üçündür.",
    ApplicationRole.REFEREE: "Hakim qeydiyyatı 18-55 yaş arası üçündür.",
    ApplicationRole.MEDIC: "Həkim qeydiyyatı 18-75 yaş arası üçündür.",
}


def calculate_age(dob: date, today: date | None = None) -> int:
    today = today or date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def is_age_in_range_for_role(role: str, dob: date, today: date | None = None) -> bool:
    min_age, max_age = AGE_LIMITS[role]
    age = calculate_age(dob, today)
    return min_age <= age <= max_age
