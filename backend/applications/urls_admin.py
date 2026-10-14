from django.urls import path

from .views import (
    ApplicationAdminFieldsView,
    ApplicationBulkStatusView,
    ApplicationCountsView,
    ApplicationDetailView,
    ApplicationExportView,
    ApplicationListView,
    ApplicationNotesView,
    ApplicationRestoreView,
    ApplicationStatusUpdateView,
    ApplicationUniversitiesView,
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
    path(
        "applications/universities/",
        ApplicationUniversitiesView.as_view(),
        name="application-universities",
    ),
    path("applications/<uuid:pk>/", ApplicationDetailView.as_view(), name="application-detail"),
    path("applications/<uuid:pk>/status/", ApplicationStatusUpdateView.as_view(), name="application-status"),
    path("applications/<uuid:pk>/restore/", ApplicationRestoreView.as_view(), name="application-restore"),
    path(
        "applications/<uuid:pk>/admin-fields/",
        ApplicationAdminFieldsView.as_view(),
        name="application-admin-fields",
    ),
    path("applications/<uuid:pk>/notes/", ApplicationNotesView.as_view(), name="application-notes"),
]
