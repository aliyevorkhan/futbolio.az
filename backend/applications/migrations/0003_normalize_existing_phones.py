from django.db import migrations


def _canonicalize_phone(raw):
    """Frozen copy of applications.services.canonicalize_phone's logic as
    it existed when this migration was written — deliberately not
    imported, since a migration must keep working against the schema/data
    shape it was written for even if the real function's behavior ever
    changes later.
    """
    digits = "".join(ch for ch in raw if ch.isdigit())
    if digits.startswith("00994"):
        digits = digits[2:]
    if digits.startswith("994"):
        digits = digits[3:]
    elif digits.startswith("0"):
        digits = digits[1:]
    digits = digits[:9]
    return f"+994{digits}" if digits else raw


def normalize_phones(apps, schema_editor):
    Application = apps.get_model("applications", "Application")
    batch = []
    for application in Application.objects.all().iterator():
        canonical = _canonicalize_phone(application.phone)
        if canonical != application.phone:
            application.phone = canonical
            batch.append(application)
        if len(batch) >= 500:
            Application.objects.bulk_update(batch, ["phone"])
            batch = []
    if batch:
        Application.objects.bulk_update(batch, ["phone"])


class Migration(migrations.Migration):
    dependencies = [
        ("applications", "0002_player_university_referee_cert_link"),
    ]

    operations = [
        migrations.RunPython(normalize_phones, migrations.RunPython.noop),
    ]
