from django.core import signing

LOGIN_TOKEN_SALT = "accounts.login_token"
LOGIN_TOKEN_MAX_AGE = 300  # 5 minutes — just long enough to complete the TOTP step


def issue_login_token(admin_id) -> str:
    return signing.dumps(str(admin_id), salt=LOGIN_TOKEN_SALT)


def read_login_token(token: str) -> str | None:
    try:
        return signing.loads(token, salt=LOGIN_TOKEN_SALT, max_age=LOGIN_TOKEN_MAX_AGE)
    except signing.BadSignature:
        return None
