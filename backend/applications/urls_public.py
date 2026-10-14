from django.urls import path

from .views import CreateApplicationView, PhoneAvailabilityView

urlpatterns = [
    path("applications/", CreateApplicationView.as_view(), name="application-create"),
    path("applications/check-phone/", PhoneAvailabilityView.as_view(), name="application-check-phone"),
]
