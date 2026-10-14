import django_filters
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend, FilterSet
from rest_framework import filters, generics, serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView

from audit.services import log_event
from common.enums import ApplicationStatus, FileKind
from common.export import rows_to_csv_bytes, rows_to_xlsx_bytes
from common.ip import get_client_ip
from common.pagination import AdminApplicationsPagination
from common.permissions import IsAdmin
from common.storage import presign_get_export
from common.throttling import CloudflareAwareScopedRateThrottle
from files.services import delete_files_for_application
from notifications.tasks import notify_admins_new_application_task

from .models import AdminNote, Application, StatusChange
from .serializers import (
    AdminNoteCreateSerializer,
    AdminNoteSerializer,
    ApplicationCreateSerializer,
    ApplicationDetailSerializer,
    ApplicationListSerializer,
    BulkStatusUpdateSerializer,
    PhoneInputSerializer,
    StatusUpdateSerializer,
    headline_position,
)
from .services import PENDING_STATUSES, find_duplicate_phone_groups, resolve_restore_status

DUPLICATE_PHONE_ADMIN_ERROR = "Bu nömrə artıq başqa namizədə aiddir."

APPLICATION_RELATED = (
    "player_details",
    "referee_details",
    "medic_details",
    "availability",
)


class CreateApplicationView(APIView):
    """The single public entry point for the whole 5-step wizard — the
    entire submission (application + role details + availability + consents
    + file attachment) lands atomically or not at all.
    """

    permission_classes = [AllowAny]
    throttle_classes = [CloudflareAwareScopedRateThrottle]
    throttle_scope = "registration"

    def post(self, request):
        serializer = ApplicationCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            application = serializer.save()

        notify_admins_new_application_task.delay(
            application_id=str(application.id),
            role=application.role,
            position=getattr(application, "_headline_position", ""),
        )
        return Response({"id": str(application.id)}, status=status.HTTP_201_CREATED)


class PhoneAvailabilityView(APIView):
    """Hit when the candidate advances past Step 1, not on blur and not
    only at final submit — lets the wizard block early with the WhatsApp
    message, before the candidate has filled in the rest of the form."""

    permission_classes = [AllowAny]
    throttle_classes = [CloudflareAwareScopedRateThrottle]
    throttle_scope = "phone_check"

    def post(self, request):
        serializer = PhoneInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        canonical = serializer.validated_data["phone"]
        available = not Application.objects.filter(phone=canonical).exists()
        return Response({"available": available})


# --- Admin ------------------------------------------------------------------------


class ApplicationFilterSet(FilterSet):
    date_from = django_filters.DateFilter(field_name="created_at", lookup_expr="date__gte")
    date_to = django_filters.DateFilter(field_name="created_at", lookup_expr="date__lte")
    position = django_filters.CharFilter(method="filter_position")
    time_slot = django_filters.CharFilter(method="filter_time_slot")
    level = django_filters.CharFilter(field_name="player_details__experience_level")
    # Admin-panel tab grouping (Gözləyir/Qəbul edildi/Silindi) — kept
    # separate from the raw `status` filter so the Pending tab's own
    # sub-status chip (Yeni/Baxılıb/...) still works alongside it.
    tab = django_filters.CharFilter(method="filter_tab")

    class Meta:
        model = Application
        fields = ["role", "district", "status", "date_from", "date_to"]

    def filter_position(self, queryset, name, value):
        return queryset.filter(
            Q(player_details__main_position=value) | Q(medic_details__specialty__contains=[value])
        )

    def filter_time_slot(self, queryset, name, value):
        return queryset.filter(availability__time_slots__contains=[value])

    def filter_tab(self, queryset, name, value):
        if value == "pending":
            return queryset.filter(status__in=PENDING_STATUSES)
        if value == "accepted":
            return queryset.filter(status=ApplicationStatus.ACCEPTED)
        if value == "deleted":
            return queryset.filter(status=ApplicationStatus.REJECTED)
        return queryset


class ApplicationListView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = ApplicationListSerializer
    pagination_class = AdminApplicationsPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ApplicationFilterSet
    search_fields = ["full_name", "phone"]
    ordering_fields = ["created_at", "full_name", "status"]
    ordering = ["-created_at"]
    queryset = Application.objects.select_related(*APPLICATION_RELATED).prefetch_related("files")


class ApplicationCountsView(APIView):
    """The 3 tab badge counts, computed under whatever filters (role,
    district, search, etc.) are currently applied — minus `tab` itself,
    which this computes once per bucket — so the counts shown next to
    each tab always match what that tab would actually return."""

    permission_classes = [IsAdmin]

    def get(self, request):
        base_queryset = Application.objects.all()
        counts = {}
        for tab in ("pending", "accepted", "deleted"):
            params = request.query_params.copy()
            params["tab"] = tab
            counts[tab] = ApplicationFilterSet(params, queryset=base_queryset).qs.count()
        return Response(counts)


class ApplicationBulkStatusView(APIView):
    """Bulk accept/delete from the admin list — same per-row StatusChange
    + audit-log write `ApplicationStatusUpdateView` does, just looped
    inside one transaction so a bulk action produces the identical audit
    trail individual actions do."""

    permission_classes = [IsAdmin]

    def post(self, request):
        serializer = BulkStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ids = serializer.validated_data["ids"]
        new_status = serializer.validated_data["status"]
        reason = serializer.validated_data.get("reason", "")

        applications = list(Application.objects.filter(id__in=ids))
        updated_ids = []
        with transaction.atomic():
            for application in applications:
                old_status = application.status
                StatusChange.objects.create(
                    application=application,
                    from_status=old_status,
                    to_status=new_status,
                    changed_by=request.user,
                    reason=reason,
                )
                application.status = new_status
                application.save(update_fields=["status", "updated_at"])
                updated_ids.append(str(application.id))

        for app_id in updated_ids:
            log_event(
                actor=request.user,
                action="admin.application.status_changed",
                target_type="application",
                target_id=app_id,
                ip=get_client_ip(request),
                meta={"to": new_status, "bulk": True},
            )
        return Response({"updated": updated_ids})


class ApplicationRestoreView(APIView):
    """"Bərpa et" (from the Deleted tab) / "Gözləyənlərə qaytar" (from the
    Accepted tab) — both just move the application back to the pending
    bucket, restoring whatever pending sub-status it had before being
    accepted/rejected rather than flatly resetting it to "new"."""

    permission_classes = [IsAdmin]

    def post(self, request, pk):
        application = get_object_or_404(Application, pk=pk)
        new_status = resolve_restore_status(application)
        old_status = application.status

        with transaction.atomic():
            StatusChange.objects.create(
                application=application,
                from_status=old_status,
                to_status=new_status,
                changed_by=request.user,
                reason="restored",
            )
            application.status = new_status
            application.save(update_fields=["status", "updated_at"])

        log_event(
            actor=request.user,
            action="admin.application.status_changed",
            target_type="application",
            target_id=str(pk),
            ip=get_client_ip(request),
            meta={"from": old_status, "to": new_status, "restored": True},
        )
        return Response(ApplicationDetailSerializer(application).data)


class DuplicatePhonesView(APIView):
    """Permanent read-only surface, kept live even after the DB-level
    unique constraint ships — defense-in-depth for the one scenario the
    constraint can't catch (two different raw strings that only collide
    after normalization, if some future write path ever bypasses
    canonicalize_phone). Never deletes/merges; a human resolves a real
    conflict via the phone-edit endpoint above."""

    permission_classes = [IsAdmin]

    def get(self, request):
        return Response(find_duplicate_phone_groups())


class ApplicationDetailView(APIView):
    permission_classes = [IsAdmin]

    def get_object(self, pk):
        return get_object_or_404(
            Application.objects.select_related(*APPLICATION_RELATED).prefetch_related(
                "files", "consents", "status_history", "notes"
            ),
            pk=pk,
        )

    def get(self, request, pk):
        application = self.get_object(pk)
        log_event(
            actor=request.user,
            action="admin.application.viewed",
            target_type="application",
            target_id=str(pk),
            ip=get_client_ip(request),
        )
        return Response(ApplicationDetailSerializer(application).data)

    def patch(self, request, pk):
        """Admin-only phone edit — the one way to resolve a real duplicate
        the "Dublikat nömrələr" report surfaces, since nothing is ever
        deleted/merged automatically."""
        application = get_object_or_404(Application, pk=pk)
        serializer = PhoneInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        canonical = serializer.validated_data["phone"]

        if Application.objects.exclude(pk=pk).filter(phone=canonical).exists():
            raise serializers.ValidationError({"phone": [DUPLICATE_PHONE_ADMIN_ERROR]})

        old_phone = application.phone
        try:
            with transaction.atomic():
                application.phone = canonical
                application.save(update_fields=["phone", "updated_at"])
        except IntegrityError as exc:
            # Race-condition backstop once the DB-level unique constraint
            # is live (Release 2) — same error shape as the exists() check
            # above, never a raw 500.
            raise serializers.ValidationError({"phone": [DUPLICATE_PHONE_ADMIN_ERROR]}) from exc

        log_event(
            actor=request.user,
            action="admin.application.phone_updated",
            target_type="application",
            target_id=str(pk),
            ip=get_client_ip(request),
            meta={"from": old_phone, "to": canonical},
        )
        return Response(ApplicationDetailSerializer(application).data)

    def delete(self, request, pk):
        if request.data.get("confirm") is not True:
            return Response({"detail": "confirm must be true."}, status=status.HTTP_400_BAD_REQUEST)

        application = get_object_or_404(Application, pk=pk)
        meta = {"full_name": application.full_name, "phone": application.phone}
        delete_files_for_application(application)
        log_event(
            actor=request.user,
            action="admin.application.deleted",
            target_type="application",
            target_id=str(pk),
            ip=get_client_ip(request),
            meta=meta,
        )
        application.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ApplicationStatusUpdateView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        application = get_object_or_404(Application, pk=pk)
        serializer = StatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data["status"]
        reason = serializer.validated_data.get("reason", "")
        old_status = application.status

        with transaction.atomic():
            StatusChange.objects.create(
                application=application,
                from_status=old_status,
                to_status=new_status,
                changed_by=request.user,
                reason=reason,
            )
            application.status = new_status
            application.save(update_fields=["status", "updated_at"])

        log_event(
            actor=request.user,
            action="admin.application.status_changed",
            target_type="application",
            target_id=str(pk),
            ip=get_client_ip(request),
            meta={"from": old_status, "to": new_status},
        )
        return Response(ApplicationDetailSerializer(application).data)


class ApplicationNotesView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return AdminNote.objects.filter(application_id=self.kwargs["pk"]).order_by("-created_at")

    def get_serializer_class(self):
        return AdminNoteCreateSerializer if self.request.method == "POST" else AdminNoteSerializer

    def perform_create(self, serializer):
        application = get_object_or_404(Application, pk=self.kwargs["pk"])
        serializer.save(application=application, admin=self.request.user)


EXPORT_HEADER = [
    "id",
    "role",
    "full_name",
    "date_of_birth",
    "phone",
    "district",
    "status",
    "is_duplicate",
    "position",
    "availability_time_slots",
    "availability_districts",
    "created_at",
    "photo_link",
]

EXPORT_CONTENT_TYPES = {
    "csv": "text/csv",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}


class ApplicationExportView(APIView):
    permission_classes = [IsAdmin]

    def perform_content_negotiation(self, request, force=False):
        # ?format=csv|xlsx here selects the export format, not a DRF
        # renderer (this view always returns a raw HttpResponse) — DRF's
        # default negotiation would otherwise 404 on an unregistered
        # "csv"/"xlsx" format via its own ?format query-param convention.
        return (JSONRenderer(), JSONRenderer.media_type)

    def get(self, request):
        fmt = (request.query_params.get("format") or "csv").lower()
        if fmt not in EXPORT_CONTENT_TYPES:
            fmt = "csv"

        base_queryset = Application.objects.select_related(*APPLICATION_RELATED).prefetch_related(
            "files", "availability"
        )
        queryset = ApplicationFilterSet(request.query_params, queryset=base_queryset).qs

        rows = []
        for application in queryset:
            availability = getattr(application, "availability", None)
            photo = next((f for f in application.files.all() if f.kind == FileKind.PHOTO), None)
            photo_link = (
                presign_get_export(
                    photo.storage_key, photo.original_name, photo.detected_mime or photo.declared_mime
                )
                if photo
                else ""
            )
            rows.append(
                [
                    str(application.id),
                    application.role,
                    application.full_name,
                    application.date_of_birth,
                    application.phone,
                    application.district,
                    application.status,
                    application.is_duplicate,
                    headline_position(application),
                    ",".join(availability.time_slots) if availability else "",
                    ",".join(availability.districts) if availability else "",
                    application.created_at.isoformat(),
                    photo_link,
                ]
            )

        if fmt == "xlsx":
            content = rows_to_xlsx_bytes(EXPORT_HEADER, rows)
            filename = "futbolio-applications.xlsx"
        else:
            content = rows_to_csv_bytes(EXPORT_HEADER, rows)
            filename = "futbolio-applications.csv"

        response = HttpResponse(content, content_type=EXPORT_CONTENT_TYPES[fmt])
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        log_event(
            actor=request.user,
            action="admin.application.exported",
            ip=get_client_ip(request),
            meta={"row_count": len(rows), "format": fmt},
        )
        return response
