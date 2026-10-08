from django.urls import path

from .views import (
    ApplicationDetailView,
    ApplicationExportView,
    ApplicationListView,
    ApplicationNotesView,
    ApplicationStatusUpdateView,
)

urlpatterns = [
    path("applications/", ApplicationListView.as_view(), name="application-list"),
    path("applications/export/", ApplicationExportView.as_view(), name="application-export"),
    path("applications/<uuid:pk>/", ApplicationDetailView.as_view(), name="application-detail"),
    path("applications/<uuid:pk>/status/", ApplicationStatusUpdateView.as_view(), name="application-status"),
    path("applications/<uuid:pk>/notes/", ApplicationNotesView.as_view(), name="application-notes"),
]
