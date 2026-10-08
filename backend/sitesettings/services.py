from .models import DEFAULT_SETTINGS, SettingEntry


def get_setting(key: str):
    try:
        return SettingEntry.objects.get(key=key).value
    except SettingEntry.DoesNotExist:
        return DEFAULT_SETTINGS.get(key)


def get_all_scalar_settings() -> dict:
    stored = {entry.key: entry.value for entry in SettingEntry.objects.all()}
    return {**DEFAULT_SETTINGS, **stored}


def set_setting(key: str, value, updated_by=None) -> SettingEntry:
    entry, _ = SettingEntry.objects.update_or_create(
        key=key, defaults={"value": value, "updated_by": updated_by}
    )
    return entry
