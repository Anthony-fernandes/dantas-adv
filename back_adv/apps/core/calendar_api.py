from django.db import models
from django.utils.dateparse import parse_datetime
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.models import CalendarEvent
from apps.core.permissions import IsTenantMember
from apps.core.viewsets import TenantAuditedModelViewSet
from apps.processes.models import Hearing


class CalendarEventSerializer(serializers.ModelSerializer):
    source = serializers.SerializerMethodField()

    class Meta:
        model = CalendarEvent
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'created_at', 'updated_at', 'created_by', 'updated_by', 'kind', 'process_id_ref', 'hearing_id_ref', 'source')

    def get_source(self, obj):
        return 'custom'


class CalendarEventFeedSerializer(serializers.Serializer):
    id = serializers.CharField()
    title = serializers.CharField()
    description = serializers.CharField(allow_blank=True, required=False)
    start_at = serializers.DateTimeField()
    end_at = serializers.DateTimeField(allow_null=True, required=False)
    all_day = serializers.BooleanField(default=False)
    location = serializers.CharField(allow_blank=True, required=False)
    color = serializers.CharField(allow_blank=True, required=False)
    kind = serializers.CharField()
    source = serializers.CharField()
    process_id = serializers.CharField(allow_null=True, required=False)
    hearing_id = serializers.CharField(allow_null=True, required=False)
    status = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    modality = serializers.CharField(allow_blank=True, allow_null=True, required=False)


class CalendarEventViewSet(TenantAuditedModelViewSet):
    queryset = CalendarEvent.objects.all()
    serializer_class = CalendarEventSerializer
    permission_classes = [IsTenantMember]
    audit_enabled = True
    audit_entity_type = 'CalendarEvent'
    filterset_fields = {'all_day': ['exact']}
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['start_at', 'created_at', 'title']
    ordering = ['start_at']

    @action(detail=False, methods=['get'], url_path='feed')
    def feed(self, request):
        tenant = request.tenant
        start = parse_datetime(request.query_params.get('start')) if request.query_params.get('start') else None
        end = parse_datetime(request.query_params.get('end')) if request.query_params.get('end') else None

        custom_qs = self.get_queryset()
        if start:
            # Eventos recorrentes entram mesmo com início anterior à janela;
            # a expansão em ocorrências acontece no cliente.
            custom_qs = custom_qs.filter(
                models.Q(start_at__gte=start) | ~models.Q(recurrence='none')
            )
            custom_qs = custom_qs.exclude(
                ~models.Q(recurrence='none')
                & models.Q(recurrence_until__isnull=False)
                & models.Q(recurrence_until__lt=start.date())
            )
        if end:
            custom_qs = custom_qs.filter(start_at__lte=end)

        hearing_qs = Hearing.objects.filter(tenant=tenant, deleted_at__isnull=True)
        if start:
            hearing_qs = hearing_qs.filter(hearing_date__gte=start)
        if end:
            hearing_qs = hearing_qs.filter(hearing_date__lte=end)

        items = []
        for ev in custom_qs.order_by('start_at'):
            items.append({
                'id': str(ev.id),
                'title': ev.title,
                'description': ev.description or '',
                'start_at': ev.start_at,
                'end_at': ev.end_at,
                'all_day': ev.all_day,
                'location': ev.location or '',
                'color': ev.color or '',
                'kind': ev.kind,
                'recurrence': ev.recurrence,
                'recurrence_until': ev.recurrence_until.isoformat() if ev.recurrence_until else None,
                'source': 'custom',
                'process_id': str(ev.process_id_ref) if ev.process_id_ref else None,
                'hearing_id': str(ev.hearing_id_ref) if ev.hearing_id_ref else None,
                'status': None,
                'modality': None,
            })

        for h in hearing_qs.select_related('process').order_by('hearing_date'):
            items.append({
                'id': f'hearing-{h.id}',
                'title': f'Audiência: {h.type or "Sem tipo"}',
                'description': h.notes or '',
                'start_at': h.hearing_date,
                'end_at': None,
                'all_day': False,
                'location': h.location or h.online_link or '',
                'color': '#2563eb',
                'kind': 'HEARING',
                'source': 'hearing',
                'process_id': str(h.process_id),
                'hearing_id': str(h.id),
                'status': h.status,
                'modality': h.modality,
            })

        items.sort(key=lambda x: x['start_at'])
        return Response(CalendarEventFeedSerializer(items, many=True).data)
