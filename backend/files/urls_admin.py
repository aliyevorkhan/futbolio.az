from django.urls import path

from . import views

urlpatterns = [
    path(
        "applications/<uuid:application_id>/files/<uuid:file_id>/url/",
        views.ApplicationFileURLView.as_view(),
        name="application-file-url",
    ),
]
