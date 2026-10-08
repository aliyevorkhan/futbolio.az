from django.urls import path

from . import views

urlpatterns = [
    path("admin-users/", views.AdminUserListCreateView.as_view(), name="admin-user-list-create"),
    path("admin-users/<uuid:pk>/disable/", views.AdminUserDisableView.as_view(), name="admin-user-disable"),
    path(
        "admin-users/<uuid:pk>/reset-password/",
        views.AdminUserForcePasswordResetView.as_view(),
        name="admin-user-force-reset",
    ),
]
