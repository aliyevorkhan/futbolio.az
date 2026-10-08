from django.urls import path

from . import views

urlpatterns = [
    path("csrf/", views.CsrfCookieView.as_view(), name="admin-csrf"),
    path("login/", views.LoginView.as_view(), name="admin-login"),
    path("totp/enroll/", views.TOTPEnrollView.as_view(), name="admin-totp-enroll"),
    path("totp/confirm/", views.TOTPConfirmView.as_view(), name="admin-totp-confirm"),
    path("totp/verify/", views.TOTPVerifyView.as_view(), name="admin-totp-verify"),
    path("logout/", views.LogoutView.as_view(), name="admin-logout"),
    path(
        "password-reset/request/",
        views.PasswordResetRequestView.as_view(),
        name="admin-password-reset-request",
    ),
    path(
        "password-reset/confirm/",
        views.PasswordResetConfirmView.as_view(),
        name="admin-password-reset-confirm",
    ),
    path("me/", views.MeView.as_view(), name="admin-me"),
]
