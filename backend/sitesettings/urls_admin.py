from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import AdminScalarSettingsView, FAQItemAdminViewSet, VideoCardAdminViewSet

router = DefaultRouter()
router.register("video-cards", VideoCardAdminViewSet, basename="admin-video-card")
router.register("faq", FAQItemAdminViewSet, basename="admin-faq")

urlpatterns = [
    path("settings/", AdminScalarSettingsView.as_view(), name="admin-settings"),
] + router.urls
