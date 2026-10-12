"""
Django settings for the Futbolio backend.

Every secret/credential is read from the environment (django-environ) —
nothing sensitive is hardcoded here or committed to git. See /.env.example
at the repo root for the full list of variables this file consumes.
"""

from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
environ.Env.read_env(str(BASE_DIR.parent / ".env"))

SECRET_KEY = env("DJANGO_SECRET_KEY", default="dev-insecure-secret-key-change-me")
DEBUG = env.bool("DJANGO_DEBUG", default=False)
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])

FRONTEND_URL = env("FRONTEND_URL", default="http://localhost:3000")

# --- Applications -------------------------------------------------------------

DJANGO_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.admin",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
]

LOCAL_APPS = [
    "common",
    "accounts",
    "applications",
    "files",
    "audit",
    "sitesettings",
    "notifications",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

AUTH_USER_MODEL = "accounts.AdminUser"

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "common.middleware.SecurityHeadersMiddleware",
    "common.middleware.RequestIdLoggingMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# --- Database -------------------------------------------------------------

DATABASES = {
    "default": env.db(
        "DATABASE_URL",
        default=f"postgres://{env('POSTGRES_USER', default='futbolio')}:"
        f"{env('POSTGRES_PASSWORD', default='futbolio-dev-password')}@"
        f"{env('POSTGRES_HOST', default='postgres')}:"
        f"{env('POSTGRES_PORT', default='5432')}/"
        f"{env('POSTGRES_DB', default='futbolio')}",
    )
}
DATABASES["default"]["CONN_MAX_AGE"] = 60

# --- Password validation / hashing ----------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": env.int("PASSWORD_MIN_LENGTH", default=12)},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
]

PASSWORD_HIBP_CHECK_ENABLED = env.bool("PASSWORD_HIBP_CHECK_ENABLED", default=False)

# --- i18n / tz -------------------------------------------------------------

LANGUAGE_CODE = "az"
TIME_ZONE = "Asia/Baku"
USE_I18N = True
USE_TZ = True

# --- Static / media ----------------------------------------------------------

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- Object storage (S3-compatible: MinIO in dev, Hetzner Object Storage in prod) ---
# Always S3Boto3Storage — no local-filesystem fallback. The presigned-PUT
# upload architecture is core to this product's security model (candidate
# browsers must PUT directly to real object storage, never through the app
# server), so local dev always exercises the real thing via MinIO.

AWS_ACCESS_KEY_ID = env("AWS_ACCESS_KEY_ID", default="")
AWS_SECRET_ACCESS_KEY = env("AWS_SECRET_ACCESS_KEY", default="")
AWS_S3_BUCKET = env("AWS_S3_BUCKET", default="futbolio-uploads")
AWS_S3_ENDPOINT_URL = env("AWS_S3_ENDPOINT_URL", default="https://nbg1.your-objectstorage.com")
AWS_S3_REGION_NAME = env("AWS_S3_REGION_NAME", default="nbg1")
AWS_S3_ADDRESSING_STYLE = env("AWS_S3_ADDRESSING_STYLE", default="virtual")

STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
        "OPTIONS": {
            "bucket_name": AWS_S3_BUCKET,
            "endpoint_url": AWS_S3_ENDPOINT_URL,
            "region_name": AWS_S3_REGION_NAME,
            "addressing_style": AWS_S3_ADDRESSING_STYLE,
            "access_key": AWS_ACCESS_KEY_ID,
            "secret_key": AWS_SECRET_ACCESS_KEY,
            "default_acl": "private",
            "querystring_auth": False,
            "file_overwrite": False,
        },
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}

# --- ClamAV (always on — spec section 10.3 / acceptance test EICAR) -----------

CLAMAV_HOST = env("CLAMAV_HOST", default="clamav")
CLAMAV_PORT = env.int("CLAMAV_PORT", default=3310)

# --- File handling tunables ---------------------------------------------------

FILE_PRESIGN_UPLOAD_TTL_SECONDS = env.int("FILE_PRESIGN_UPLOAD_TTL_SECONDS", default=600)
FILE_PRESIGN_VIEW_TTL_SECONDS = env.int("FILE_PRESIGN_VIEW_TTL_SECONDS", default=900)
FILE_PRESIGN_EXPORT_TTL_SECONDS = env.int("FILE_PRESIGN_EXPORT_TTL_SECONDS", default=604800)
FILE_ABANDONED_PURGE_HOURS = env.int("FILE_ABANDONED_PURGE_HOURS", default=24)

MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024
MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024
MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024

# --- Retention -----------------------------------------------------------------

APPLICATION_RETENTION_MONTHS_DEFAULT = env.int("APPLICATION_RETENTION_MONTHS_DEFAULT", default=12)
AUDIT_LOG_RETENTION_MONTHS = env.int("AUDIT_LOG_RETENTION_MONTHS", default=12)

# --- Rate limiting / lockout ----------------------------------------------------

RATE_LIMIT_REGISTRATION_PER_HOUR = env.int("RATE_LIMIT_REGISTRATION_PER_HOUR", default=5)
RATE_LIMIT_UPLOAD_LINK_PER_MINUTE = env.int("RATE_LIMIT_UPLOAD_LINK_PER_MINUTE", default=20)
ADMIN_LOGIN_LOCKOUT_THRESHOLD = env.int("ADMIN_LOGIN_LOCKOUT_THRESHOLD", default=5)
ADMIN_LOGIN_LOCKOUT_MINUTES = env.int("ADMIN_LOGIN_LOCKOUT_MINUTES", default=15)

# --- Turnstile -------------------------------------------------------------------

TURNSTILE_SITE_KEY = env("TURNSTILE_SITE_KEY", default="")
TURNSTILE_SECRET_KEY = env("TURNSTILE_SECRET_KEY", default="")
TURNSTILE_BYPASS = env.bool("TURNSTILE_BYPASS", default=False)

# --- Notifications ----------------------------------------------------------------

NOTIFICATIONS_BACKEND = env("NOTIFICATIONS_BACKEND", default="console")
TELEGRAM_BOT_TOKEN = env("TELEGRAM_BOT_TOKEN", default="")
TELEGRAM_CHAT_ID = env("TELEGRAM_CHAT_ID", default="")

# --- Email -------------------------------------------------------------------------

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = env("EMAIL_HOST", default="mailpit")
EMAIL_PORT = env.int("EMAIL_PORT", default=1025)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=False)
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="Futbolio <no-reply@futbolio.az>")

# --- CORS / CSRF / Session cookies --------------------------------------------------
# futbolio.az (frontend) and api.futbolio.az (backend) are different
# subdomains of the same registrable domain, so SameSite=Strict cookies are
# still sent on cross-subdomain XHR (only cross-SITE top-level navigation is
# blocked) as long as SESSION_COOKIE_DOMAIN is the shared parent domain.

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=["http://localhost:3000"])
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = env.list(
    "CSRF_TRUSTED_ORIGINS", default=["http://localhost:3000", "http://localhost:8000"]
)
CSRF_COOKIE_SECURE = env.bool("SESSION_COOKIE_SECURE", default=False)
CSRF_COOKIE_HTTPONLY = False  # frontend must read it to set X-CSRFToken
CSRF_COOKIE_SAMESITE = "Strict"

SESSION_ENGINE = "django.contrib.sessions.backends.cached_db"
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = env.bool("SESSION_COOKIE_SECURE", default=False)
SESSION_COOKIE_SAMESITE = "Strict"
SESSION_COOKIE_DOMAIN = env("SESSION_COOKIE_DOMAIN", default=None) or None
SESSION_COOKIE_AGE = 8 * 60 * 60  # 8h
SESSION_SAVE_EVERY_REQUEST = True  # sliding inactivity window
SESSION_EXPIRE_AT_BROWSER_CLOSE = False

# --- Security headers (also see common/middleware.py for CSP/Permissions-Policy) ---

SECURE_HSTS_SECONDS = 0 if DEBUG else 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG
SECURE_SSL_REDIRECT = not DEBUG
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# --- Cache (Redis — also backs DRF throttling + cached_db sessions) ----------------

REDIS_URL = env("REDIS_URL", default="redis://redis:6379/0")
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
    }
}

# --- Celery --------------------------------------------------------------------------

CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_DEFAULT_QUEUE = "default"

# --- DRF -------------------------------------------------------------------------------

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "common.pagination.StandardPagination",
    "PAGE_SIZE": 50,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
    ],
    "DEFAULT_THROTTLE_CLASSES": [],
    "DEFAULT_THROTTLE_RATES": {
        "registration": f"{RATE_LIMIT_REGISTRATION_PER_HOUR}/hour",
        "upload_presign": f"{RATE_LIMIT_UPLOAD_LINK_PER_MINUTE}/minute",
        "admin_login": "10/minute",
    },
    "EXCEPTION_HANDLER": "common.exceptions.generic_exception_handler",
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Futbolio API",
    "DESCRIPTION": "Registration + admin API for futbolio.az",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
}

# --- Sentry (optional, no-op when DSN is blank) ---------------------------------------

SENTRY_DSN = env("SENTRY_DSN", default="")
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.celery import CeleryIntegration
    from sentry_sdk.integrations.django import DjangoIntegration

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration(), CeleryIntegration()],
        traces_sample_rate=0.1,
        send_default_pii=False,
    )

# --- Logging ---------------------------------------------------------------------------
# Full detail (including stack traces) only ever goes here — API responses to
# clients are always generic (see common/exceptions.py).

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{asctime}] {levelname} {name} req={request_id} {message}",
            "style": "{",
        },
    },
    "filters": {
        "request_id": {"()": "common.logging_filters.RequestIdFilter"},
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
            "filters": ["request_id"],
        },
    },
    "root": {"handlers": ["console"], "level": "INFO"},
    "loggers": {
        "django": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "futbolio": {"handlers": ["console"], "level": "INFO", "propagate": False},
    },
}

# --- Misc app-level toggles used by `common` helpers ------------------------------------

DEFAULT_FROM_EMAIL_NAME = "Futbolio"
IP_HASH_SALT = env("DJANGO_SECRET_KEY", default="dev-insecure-secret-key-change-me")
