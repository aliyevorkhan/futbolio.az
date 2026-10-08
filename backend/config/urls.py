from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    # Kept only for emergency superuser access (createsuperuser), never the
    # product's admin panel — that lives entirely in the Next.js frontend
    # against the /api/admin/* endpoints below. Not linked from anywhere.
    path("django-admin/", admin.site.urls),
    path("api/public/", include("applications.urls_public")),
    path("api/public/", include("files.urls_public")),
    path("api/public/", include("sitesettings.urls_public")),
    path("api/admin/auth/", include("accounts.urls")),
    path("api/admin/", include("accounts.urls_admin")),
    path("api/admin/", include("applications.urls_admin")),
    path("api/admin/", include("files.urls_admin")),
    path("api/admin/", include("sitesettings.urls_admin")),
    path("api/admin/", include("audit.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
]

if settings.DEBUG:
    urlpatterns += [
        path(
            "api/schema/swagger-ui/",
            SpectacularSwaggerView.as_view(url_name="schema"),
            name="swagger-ui",
        ),
    ]
