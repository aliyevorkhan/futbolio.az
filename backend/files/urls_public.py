from django.urls import path

from . import views

urlpatterns = [
    path("uploads/presign/", views.UploadPresignView.as_view(), name="upload-presign"),
    path("uploads/<uuid:file_id>/complete/", views.UploadCompleteView.as_view(), name="upload-complete"),
]
