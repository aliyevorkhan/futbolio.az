from django.urls import path

from .views import CreateApplicationView

urlpatterns = [
    path("applications/", CreateApplicationView.as_view(), name="application-create"),
]
