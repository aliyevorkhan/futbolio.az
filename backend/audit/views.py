import django_filters
from rest_framework import generics

from common.permissions import IsAdmin

from .models import AuditLogEntry
from .serializers import AuditLogEntrySerializer


class AuditLogFilter(django_filters.FilterSet):
    action = django_filters.CharFilter(field_name="action", lookup_expr="icontains")
    actor = django_filters.CharFilter(field_name="actor_id")
    target_type = django_filters.CharFilter(field_name="target_type")
    target_id = django_filters.CharFilter(field_name="target_id")
    date_from = django_filters.IsoDateTimeFilter(field_name="created_at", lookup_expr="gte")
    date_to = django_filters.IsoDateTimeFilter(field_name="created_at", lookup_expr="lte")

    class Meta:
        model = AuditLogEntry
        fields = ["action", "actor", "target_type", "target_id", "date_from", "date_to"]


class AuditLogListView(generics.ListAPIView):
    """List/filter only — there is deliberately no retrieve-by-id, update,
    or delete route anywhere for this model (spec: "admins cannot delete
    it"). The only thing that ever removes rows is the configurable
    retention task in tasks.py.
    """

    permission_classes = [IsAdmin]
    serializer_class = AuditLogEntrySerializer
    queryset = AuditLogEntry.objects.select_related("actor").all()
    filterset_class = AuditLogFilter
