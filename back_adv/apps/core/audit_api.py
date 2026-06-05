from __future__ import annotations

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import serializers

from apps.core.models import AuditEvent
from apps.core.permissions import IsOwnerOrAdmin, IsTenantMember
from apps.core.viewsets import TenantAuditedModelViewSet


class AuditEventSerializer(serializers.ModelSerializer):
    actor_email = serializers.SerializerMethodField()

    def get_actor_email(self, obj):
        return getattr(obj.actor, 'email', None) if obj.actor_id else None

    class Meta:
        model = AuditEvent
        fields = [
            'id', 'tenant', 'actor', 'actor_email',
            'event_type', 'entity_type', 'entity_id',
            'summary', 'payload',
            'created_at',
        ]
        read_only_fields = fields


class AuditEventViewSet(TenantAuditedModelViewSet):
    """Tenant-scoped audit log (read-only)."""

    queryset = AuditEvent.objects.select_related('actor').all()
    serializer_class = AuditEventSerializer
    permission_classes = [IsTenantMember, IsOwnerOrAdmin]

    http_method_names = ['get', 'head', 'options']
    audit_enabled = False

    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        'event_type': ['exact', 'icontains'],
        'entity_type': ['exact'],
        'entity_id': ['exact'],
        'actor': ['exact'],
        'created_at': ['gte', 'lte'],
    }
