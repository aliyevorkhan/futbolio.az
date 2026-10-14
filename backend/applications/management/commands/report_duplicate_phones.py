from django.core.management.base import BaseCommand

from applications.services import find_duplicate_phone_groups


class Command(BaseCommand):
    """Read-only — run before the unique-phone constraint migration
    (0004_application_unique_phone.py) to confirm production has no
    pre-existing duplicate phones, and any time after as a manual check.
    Never deletes or merges anything; resolve a real conflict via the
    admin "Dublikat nömrələr" screen (phone-edit endpoint).
    """

    help = "Report applications sharing the same canonical phone number, without changing anything."

    def handle(self, *args, **options):
        groups = find_duplicate_phone_groups()

        if not groups:
            self.stdout.write(self.style.SUCCESS("No duplicate phone numbers found."))
            return

        for group in groups:
            self.stdout.write(self.style.WARNING(f"\nPhone: {group['phone']}"))
            for application in group["applications"]:
                self.stdout.write(
                    f"  - {application['display_id']} | {application['full_name']} | "
                    f"{application['role']} | {application['status']} | {application['created_at']}"
                )

        self.stdout.write(
            self.style.ERROR(f"\n{len(groups)} duplicate phone group(s) found, resolve before")
        )
        self.stdout.write(
            self.style.ERROR("applying the unique-phone constraint migration.")
        )
        raise SystemExit(1)
