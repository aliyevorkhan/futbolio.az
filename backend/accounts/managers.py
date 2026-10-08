from django.contrib.auth.base_user import BaseUserManager


class AdminUserManager(BaseUserManager):
    """No public self-registration exists anywhere (spec section 10.4) — the
    only ways an AdminUser row is created are the `create_superadmin`
    management command (bootstrap, used once) and the super_admin-only
    `POST /api/admin/admin-users/` endpoint, both of which call
    `create_user`/`create_superuser` below.
    """

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("Admin users must have an email address.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "super_admin")
        return self._create_user(email, password, **extra_fields)
