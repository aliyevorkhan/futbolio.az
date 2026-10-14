from datetime import date

import django_filters
from django.db import IntegrityError, transaction
from django.db.models import Exists, OuterRef, Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend, FilterSet
from rest_framework import filters, generics, serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView

from audit.services import log_event
from common.age_limits import calculate_age
from common.enums import ApplicationRole, ApplicationStatus, FileKind
from common.export import rows_to_csv_bytes, rows_to_xlsx_bytes
from common.ip import get_client_ip
from common.pagination import AdminApplicationsPagination
from common.permissions import IsAdmin
from common.storage import presign_get_export
from common.throttling import CloudflareAwareScopedRateThrottle
from files.models import ApplicationFile
from files.services import delete_files_for_application
from notifications.tasks import notify_admins_new_application_task

from .models import AdminNote, Application, StatusChange
from .serializers import (
    AdminFieldsUpdateSerializer,
    AdminNoteCreateSerializer,
    AdminNoteSerializer,
    ApplicationCreateSerializer,
    ApplicationDetailSerializer,
    ApplicationListSerializer,
    BulkStatusUpdateSerializer,
    PhoneInputSerializer,
    StatusUpdateSerializer,
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


class CharInFilter(django_filters.BaseInFilter, django_filters.CharFilter):
    """Comma-separated multi-value filter (OR within the one field) — e.g.
    `?status=new,reviewed`. No MultipleChoiceFilter/BaseInFilter existed
    anywhere in this repo before Feature 4; this is the one shared recipe
    every multi-select filter below reuses."""


YES_NO_TRUE = {"yes", "true", "1"}


def _yes_no(value):
    """Normalizes a yes/no filter value to True/False/None (None = no-op,
    covers an empty or unrecognized value so a stray query param never
    turns into an accidental filter)."""
    if value in YES_NO_TRUE:
        return True
    if value in {"no", "false", "0"}:
        return False
    return None


class ApplicationFilterSet(FilterSet):
    date_from = django_filters.DateFilter(field_name="created_at", lookup_expr="date__gte")
    date_to = django_filters.DateFilter(field_name="created_at", lookup_expr="date__lte")
    status = CharInFilter(field_name="status", lookup_expr="in")
    position = CharInFilter(method="filter_position")
    position_mode = django_filters.CharFilter(method="noop")  # read inside filter_position
    time_slot = django_filters.CharFilter(method="filter_time_slot")
    level = CharInFilter(method="filter_level")
    level_source = django_filters.CharFilter(method="noop")  # read inside filter_level
    # Admin-panel tab grouping (Gözləyir/Qəbul edildi/Silindi) — kept
    # separate from the raw `status` filter so the Pending tab's own
    # sub-status chip (Yeni/Baxılıb/...) still works alongside it.
    tab = django_filters.CharFilter(method="filter_tab")

    price_min = django_filters.NumberFilter(field_name="player_details__hourly_rate_azn", lookup_expr="gte")
    price_max = django_filters.NumberFilter(field_name="player_details__hourly_rate_azn", lookup_expr="lte")
    is_student = django_filters.CharFilter(method="filter_is_student")
    university = django_filters.CharFilter(
        field_name="player_details__university_name", lookup_expr="icontains"
    )
    course_year = django_filters.NumberFilter(field_name="player_details__course_year")
    referee_certified = django_filters.CharFilter(method="filter_referee_certified")
    medic_has_document = django_filters.CharFilter(method="filter_medic_has_document")
    age_min = django_filters.NumberFilter(method="filter_age_min")
    age_max = django_filters.NumberFilter(method="filter_age_max")
    has_pro_experience = django_filters.CharFilter(method="filter_has_pro_experience")
    has_video = django_filters.CharFilter(method="filter_has_video")
    admin_rating_min = django_filters.NumberFilter(field_name="admin_rating", lookup_expr="gte")
    is_duplicate = django_filters.CharFilter(method="filter_is_duplicate")

    class Meta:
        model = Application
        fields = ["role", "district", "date_from", "date_to"]

    def noop(self, queryset, name, value):
        return queryset

    def filter_position(self, queryset, name, values):
        mode = self.data.get("position_mode") or "main_and_extra"
        main_q = Q(player_details__main_position__in=values)
        specialty_q = Q(medic_details__specialty__overlap=values)
        if mode == "main_only":
            return queryset.filter(main_q | specialty_q)
        return queryset.filter(main_q | Q(player_details__extra_positions__overlap=values) | specialty_q)

    def filter_level(self, queryset, name, values):
        source = self.data.get("level_source") or "self"
        field = (
            "player_details__admin_experience_level"
            if source == "admin"
            else "player_details__experience_level"
        )
        return queryset.filter(**{f"{field}__in": values})

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

    def filter_is_student(self, queryset, name, value):
        parsed = _yes_no(value)
        if parsed is None:
            return queryset
        return queryset.filter(player_details__is_university_student=parsed)

    def filter_referee_certified(self, queryset, name, value):
        parsed = _yes_no(value)
        if parsed is None:
            return queryset
        return queryset.filter(referee_details__has_official_certification=parsed)

    def filter_medic_has_document(self, queryset, name, value):
        parsed = _yes_no(value)
        if parsed is None:
            return queryset
        has_document = Exists(
            ApplicationFile.objects.filter(application=OuterRef("pk"), kind=FileKind.DOCUMENT)
        )
        return queryset.annotate(_has_document=has_document).filter(_has_document=parsed)

    def filter_age_min(self, queryset, name, value):
        # age >= value  <=>  date_of_birth <= today - value years
        cutoff = date.today().replace(year=date.today().year - int(value))
        return queryset.filter(date_of_birth__lte=cutoff)

    def filter_age_max(self, queryset, name, value):
        # age <= value  <=>  date_of_birth > today - (value+1) years
        cutoff = date.today().replace(year=date.today().year - int(value) - 1)
        return queryset.filter(date_of_birth__gt=cutoff)

    def filter_has_pro_experience(self, queryset, name, value):
        parsed = _yes_no(value)
        if parsed is None:
            return queryset
        return queryset.filter(player_details__has_pro_experience=parsed)

    def filter_has_video(self, queryset, name, value):
        parsed = _yes_no(value)
        if parsed is None:
            return queryset
        has_video_file = Exists(
            ApplicationFile.objects.filter(application=OuterRef("pk"), kind=FileKind.VIDEO)
        )
        queryset = queryset.annotate(_has_video_file=has_video_file)
        if parsed:
            return queryset.filter(Q(_has_video_file=True) | ~Q(video_link_url=""))
        return queryset.filter(_has_video_file=False, video_link_url="")

    def filter_is_duplicate(self, queryset, name, value):
        parsed = _yes_no(value)
        if parsed is None:
            return queryset
        return queryset.filter(is_duplicate=parsed)


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


class ApplicationAdminFieldsView(APIView):
    """Admin-only rating (stars) + admin-assigned player level — both
    genuinely new fields, never candidate-submitted. Kept separate from
    `ApplicationStatusUpdateView`/the phone-edit PATCH since this writes
    a different, purely-advisory pair of fields with its own audit action."""

    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        application = get_object_or_404(
            Application.objects.select_related("player_details"), pk=pk
        )
        serializer = AdminFieldsUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with transaction.atomic():
            if "admin_rating" in data:
                application.admin_rating = data["admin_rating"]
                application.save(update_fields=["admin_rating", "updated_at"])
            if "admin_experience_level" in data and hasattr(application, "player_details"):
                application.player_details.admin_experience_level = data["admin_experience_level"]
                application.player_details.save(update_fields=["admin_experience_level"])

        log_event(
            actor=request.user,
            action="admin.application.admin_fields_updated",
            target_type="application",
            target_id=str(pk),
            ip=get_client_ip(request),
            meta=data,
        )
        return Response(ApplicationDetailSerializer(application).data)


class ApplicationUniversitiesView(APIView):
    """Distinct non-blank university names, for the filter panel's
    searchable combobox — this codebase has no fixed universities table,
    university_name is free text, so this is the simplest option
    consistent with existing storage."""

    permission_classes = [IsAdmin]

    def get(self, request):
        names = (
            Application.objects.exclude(player_details__university_name="")
            .exclude(player_details__university_name__isnull=True)
            .values_list("player_details__university_name", flat=True)
            .distinct()
            .order_by("player_details__university_name")
        )
        return Response(list(names))


class ApplicationNotesView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]

    def get_queryset(self):
        return AdminNote.objects.filter(application_id=self.kwargs["pk"]).order_by("-created_at")

    def get_serializer_class(self):
        return AdminNoteCreateSerializer if self.request.method == "POST" else AdminNoteSerializer

    def perform_create(self, serializer):
        application = get_object_or_404(Application, pk=self.kwargs["pk"])
        serializer.save(application=application, admin=self.request.user)


def _file_link(file):
    return presign_get_export(
        file.storage_key, file.original_name, file.detected_mime or file.declared_mime
    )


def _export_photo_link(application):
    photo = next((f for f in application.files.all() if f.kind == FileKind.PHOTO), None)
    return _file_link(photo) if photo else ""


def _export_main_position(application):
    details = getattr(application, "player_details", None)
    return details.main_position if details else ""


def _export_extra_positions(application):
    details = getattr(application, "player_details", None)
    if details:
        return ",".join(details.extra_positions)
    medic = getattr(application, "medic_details", None)
    return ",".join(medic.specialty) if medic else ""


def _export_level_self(application):
    details = getattr(application, "player_details", None)
    return details.experience_level if details else ""


def _export_level_admin(application):
    details = getattr(application, "player_details", None)
    return (details.admin_experience_level or "") if details else ""


def _export_price(application):
    details = getattr(application, "player_details", None)
    return details.hourly_rate_azn if details else ""


def _export_is_student(application):
    details = getattr(application, "player_details", None)
    if not details:
        return ""
    return "Bəli" if details.is_university_student else "Xeyr"


def _export_university(application):
    details = getattr(application, "player_details", None)
    return details.university_name if details else ""


def _export_course_year(application):
    details = getattr(application, "player_details", None)
    return details.course_year or "" if details else ""


def _export_professional_periods(application):
    details = getattr(application, "player_details", None)
    if not details:
        return ""
    periods = [
        f"{period.start_year}-{period.end_year} {period.club}".strip()
        for period in details.professional_periods.all()
    ]
    return "; ".join(periods)


def _export_about_text(application):
    # No single "about yourself" field exists across all 3 roles —
    # player/referee each have their own free-text field; medic has no
    # equivalent, left blank rather than guessed (same honesty convention
    # as other disclosed per-role gaps in this codebase).
    if application.role == ApplicationRole.PLAYER:
        details = getattr(application, "player_details", None)
        return details.club_experience_text if details else ""
    if application.role == ApplicationRole.REFEREE:
        details = getattr(application, "referee_details", None)
        return details.experience_text if details else ""
    return ""


def _export_certificate_status(application):
    if application.role == ApplicationRole.REFEREE:
        details = getattr(application, "referee_details", None)
        return "Var" if details and details.has_official_certification else "Yox"
    if application.role == ApplicationRole.MEDIC:
        has_document = any(f.kind == FileKind.DOCUMENT for f in application.files.all())
        return "Var" if has_document else "Yox"
    return ""


def _export_certificate_link(application):
    if application.role == ApplicationRole.REFEREE:
        details = getattr(application, "referee_details", None)
        if details and details.certification_link:
            return details.certification_link
    document = next((f for f in application.files.all() if f.kind == FileKind.DOCUMENT), None)
    return _file_link(document) if document else ""


def _export_video_links(application):
    links = [_file_link(f) for f in application.files.all() if f.kind == FileKind.VIDEO]
    if application.video_link_url:
        links.append(application.video_link_url)
    return ", ".join(links)


def _export_admin_note(application):
    return "; ".join(note.text for note in application.notes.all())


# (export_key, Azerbaijani column header, resolver(application) -> cell value).
# Column headers use real Azerbaijani letters (ə/ğ/ı/ö/ü/ş/ç) — CSV is
# written utf-8-sig (BOM) so they render correctly in Excel.
EXPORT_COLUMN_REGISTRY = [
    ("full_name", "Ad soyad", lambda a: a.full_name),
    ("role", "Rol", lambda a: a.role),
    ("phone", "Telefon", lambda a: a.phone),
    ("date_of_birth", "Doğum tarixi", lambda a: a.date_of_birth),
    ("age", "Yaş", lambda a: calculate_age(a.date_of_birth)),
    ("main_position", "Əsas mövqe", _export_main_position),
    ("extra_positions", "Oynaya bildiyi zonalar", _export_extra_positions),
    ("level_self", "Səviyyə (özü)", _export_level_self),
    ("level_admin", "Səviyyə (admin)", _export_level_admin),
    ("price_per_game", "1 oyun üçün qiymət (AZN)", _export_price),
    ("is_student", "Tələbə", _export_is_student),
    ("university", "Universitet", _export_university),
    ("course_year", "Kurs", _export_course_year),
    ("professional_periods", "Peşəkar dövrlər", _export_professional_periods),
    ("about_text", "Özün haqqında", _export_about_text),
    ("certificate_status", "Sertifikat/Diplom", _export_certificate_status),
    ("certificate_link", "Sertifikat/Diplom linki", _export_certificate_link),
    ("video_links", "Video linkləri", _export_video_links),
    ("status", "Status", lambda a: a.status),
    ("admin_rating", "Admin reytinqi", lambda a: a.admin_rating or ""),
    ("admin_note", "Admin qeydi", _export_admin_note),
    ("created_at", "Qeydiyyat tarixi", lambda a: a.created_at.isoformat()),
    ("district", "Rayon", lambda a: a.district),
    ("photo_link", "Şəkil linki", _export_photo_link),
]
EXPORT_COLUMN_KEYS = [key for key, _, _ in EXPORT_COLUMN_REGISTRY]

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

        requested = request.query_params.get("columns")
        if requested:
            keys = [k for k in requested.split(",") if k in EXPORT_COLUMN_KEYS]
        else:
            keys = EXPORT_COLUMN_KEYS
        columns = [c for c in EXPORT_COLUMN_REGISTRY if c[0] in keys]
        header = [col[1] for col in columns]

        base_queryset = Application.objects.select_related(*APPLICATION_RELATED).prefetch_related(
            "files", "availability", "player_details__professional_periods", "notes"
        )
        queryset = ApplicationFilterSet(request.query_params, queryset=base_queryset).qs

        rows = [[resolver(application) for _, _, resolver in columns] for application in queryset]

        today = date.today().isoformat()
        if fmt == "xlsx":
            content = rows_to_xlsx_bytes(header, rows)
            filename = f"futbolio_namizedler_{today}.xlsx"
        else:
            content = rows_to_csv_bytes(header, rows)
            filename = f"futbolio_namizedler_{today}.csv"

        response = HttpResponse(content, content_type=EXPORT_CONTENT_TYPES[fmt])
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        log_event(
            actor=request.user,
            action="admin.application.exported",
            ip=get_client_ip(request),
            meta={"row_count": len(rows), "format": fmt, "columns": keys},
        )
        return response
