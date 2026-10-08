from django.urls import path

from .views import PublicSettingsView

urlpatterns = [
    path("settings/", PublicSettingsView.as_view(), name="public-settings"),
]
