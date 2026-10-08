import getpass

from django.core.management.base import BaseCommand, CommandError

from accounts.models import AdminUser
from common.enums import AdminRole


class Command(BaseCommand):
    """One-time bootstrap for the very first super_admin account — every
    subsequent admin account is created through this user via the
    super_admin-only POST /api/admin/admin-users/ API, never through this
    command again (spec section 10.4: no self-registration, ever).
    """

    help = "Create the first super_admin account (bootstrap only)."

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True)

    def handle(self, *args, **options):
        email = options["email"].strip().lower()
        if AdminUser.objects.filter(email=email).exists():
            raise CommandError(f"An account with email {email} already exists.")

        password = getpass.getpass("Password (min 12 chars): ")
        confirm = getpass.getpass("Confirm password: ")
        if password != confirm:
            raise CommandError("Passwords do not match.")
        if len(password) < 12:
            raise CommandError("Password must be at least 12 characters.")

        user = AdminUser.objects.create_superuser(email=email, password=password, role=AdminRole.SUPER_ADMIN)
        self.stdout.write(
            self.style.SUCCESS(
                f"Created super_admin {user.email}. They still need to enroll TOTP 2FA on first login."
            )
        )
