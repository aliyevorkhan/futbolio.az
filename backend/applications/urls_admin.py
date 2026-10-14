from django.urls import path

from .views import (
    ApplicationBulkStatusView,
    ApplicationCountsView,
    ApplicationDetailView,
    ApplicationExportView,
    ApplicationListView,
    ApplicationNotesView,
    ApplicationRestoreView,
    ApplicationStatusUpdateView,
    DuplicatePhonesView,
)

urlpatterns = [
    path("applications/", ApplicationListView.as_view(), name="application-list"),
    path("applications/counts/", ApplicationCountsView.as_view(), name="application-counts"),
    path("applications/bulk-status/", ApplicationBulkStatusView.as_view(), name="application-bulk-status"),
    path("applications/export/", ApplicationExportView.as_view(), name="application-export"),
    path(
        "applications/duplicate-phones/",
        DuplicatePhonesView.as_view(),
        name="application-duplicate-phones",
    ),
    path("applications/<uuid:pk>/", ApplicationDetailView.as_view(), name="application-detail"),
    path("applications/<uuid:pk>/status/", ApplicationStatusUpdateView.as_view(), name="application-status"),
    path("applications/<uuid:pk>/restore/", ApplicationRestoreView.as_view(), name="application-restore"),
    path("applications/<uuid:pk>/notes/", ApplicationNotesView.as_view(), name="application-notes"),
]
