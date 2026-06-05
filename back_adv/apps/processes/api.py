import uuid

from django.db import models
from rest_framework import serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import CauseAccessPermission, IsTenantMember, IsLegal
from apps.core.viewsets import TenantAuditedModelViewSet
from apps.core.models import AuditEvent
from apps.core.services.audit import audit_event
from apps.accounts.models import UserRole
from .models import Process, Movement, Deadline, Hearing, LegalCause
from apps.documents.models import Document
from apps.documents.api import DocumentSerializer, DocumentUploadSerializer
from apps.billing.limits import assert_can_create_process


def build_process_timeline(tenant, process: Process):
    """Build a unified timeline feed for a process (movements + deadlines + hearings).

    Returns a list of dicts ordered by date desc.
    """
    movements = list(process.movements.all())
    deadlines = list(process.deadlines.all())
    hearings = list(process.hearings.all())

    items: list[dict] = []

    for m in movements:
        items.append({
            'type': 'movement',
            'id': str(m.id),
            'date': m.date.isoformat(),
            'title': m.type or 'Andamento',
            'description': m.description,
            'status': None,
            'meta': {},
            'actor': getattr(m.created_by, 'email', None),
            'audit_event_id': None,
        })

    for d in deadlines:
        items.append({
            'type': 'deadline',
            'id': str(d.id),
            'date': d.due_date.isoformat(),
            'title': 'Prazo',
            'description': d.description,
            'status': d.status,
            'meta': {'priority': d.priority},
            'actor': getattr(d.created_by, 'email', None),
            'audit_event_id': None,
        })

    for h in hearings:
        items.append({
            'type': 'hearing',
            'id': str(h.id),
            'date': h.hearing_date.isoformat(),
            'title': 'Audiência',
            'description': h.type or '',
            'status': h.status,
            'meta': {'modality': h.modality, 'location': h.location, 'online_link': h.online_link},
            'actor': getattr(h.created_by, 'email', None),
            'audit_event_id': None,
        })

    # Attach latest audit event id per entity for convenient UI drill-down
    entity_ids = [it['id'] for it in items]
    type_to_entity = {'movement': 'Movement', 'deadline': 'Deadline', 'hearing': 'Hearing'}
    if entity_ids:
        events = (
            AuditEvent.objects
            .filter(tenant=process.tenant, entity_id__in=entity_ids)
            .order_by('-created_at')
        )
        latest_by_entity: dict[tuple[str, str], str] = {}
        for ev in events:
            key = (ev.entity_type, str(ev.entity_id))
            if key not in latest_by_entity:
                latest_by_entity[key] = str(ev.id)
        for it in items:
            ent = type_to_entity.get(it['type'])
            if ent:
                it['audit_event_id'] = latest_by_entity.get((ent, it['id']))

    items.sort(key=lambda x: x['date'], reverse=True)
    return items


class TenantScopedSerializerMixin:
    def _tenant(self):
        request = self.context.get('request')
        return getattr(request, 'tenant', None) if request else None

    def _validate_process(self, process):
        tenant = self._tenant()
        if tenant and process and getattr(process, 'tenant_id', None) != tenant.id:
            raise serializers.ValidationError({'process': 'Process does not belong to current tenant.'})
        return process

    def _validate_client(self, client):
        tenant = self._tenant()
        if tenant and client and getattr(client, 'tenant_id', None) != tenant.id:
            raise serializers.ValidationError({'client': 'Client does not belong to current tenant.'})
        return client

    def _validate_cause(self, cause):
        tenant = self._tenant()
        if tenant and cause and getattr(cause, 'tenant_id', None) != tenant.id:
            raise serializers.ValidationError({'cause': 'Cause does not belong to current tenant.'})
        return cause

    def _validate_member(self, user, field_name: str):
        tenant = self._tenant()
        if tenant and user:
            if not UserRole.objects.filter(user=user, tenant=tenant).exists():
                raise serializers.ValidationError({field_name: 'User is not a member of this tenant.'})
        return user


class ProcessSerializer(TenantScopedSerializerMixin, serializers.ModelSerializer):
    def validate(self, attrs):
        if 'client' in attrs and attrs.get('client'):
            self._validate_client(attrs['client'])
        if 'cause' in attrs and attrs.get('cause'):
            self._validate_cause(attrs['cause'])
        if 'responsible_lawyer' in attrs and attrs.get('responsible_lawyer'):
            self._validate_member(attrs['responsible_lawyer'], 'responsible_lawyer')
        return attrs

    class Meta:
        model = Process
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'created_at', 'updated_at', 'created_by', 'updated_by')


class MovementSerializer(TenantScopedSerializerMixin, serializers.ModelSerializer):
    def validate(self, attrs):
        if attrs.get('process'):
            self._validate_process(attrs['process'])
        return attrs

    class Meta:
        model = Movement
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'created_at', 'created_by')


class DeadlineSerializer(TenantScopedSerializerMixin, serializers.ModelSerializer):
    def validate(self, attrs):
        if attrs.get('process'):
            self._validate_process(attrs['process'])
        if attrs.get('responsible'):
            self._validate_member(attrs['responsible'], 'responsible')
        return attrs

    class Meta:
        model = Deadline
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'created_at', 'created_by', 'updated_by')


class HearingSerializer(TenantScopedSerializerMixin, serializers.ModelSerializer):
    def validate(self, attrs):
        if attrs.get('process'):
            self._validate_process(attrs['process'])
        if attrs.get('responsible'):
            self._validate_member(attrs['responsible'], 'responsible')
        return attrs

    class Meta:
        model = Hearing
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'created_at', 'created_by', 'updated_by')


class LegalCauseSerializer(serializers.ModelSerializer):
    class Meta:
        model = LegalCause
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'created_at', 'updated_at')


class LegalCauseViewSet(TenantAuditedModelViewSet):
    queryset = LegalCause.objects.all().order_by('name')
    serializer_class = LegalCauseSerializer
    permission_classes = [IsTenantMember, CauseAccessPermission]

    audit_enabled = True
    audit_entity_type = 'LegalCause'

    filterset_fields = {'area': ['exact'], 'is_active': ['exact']}
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['name']


class ProcessViewSet(TenantAuditedModelViewSet):
    queryset = Process.objects.select_related('client', 'responsible_lawyer').all().order_by('-updated_at')
    serializer_class = ProcessSerializer
    permission_classes = [IsTenantMember, IsLegal]

    audit_enabled = True
    audit_entity_type = 'Process'

    # Server-side list controls (PR11)
    filterset_fields = {
        'status': ['exact'],
        'phase': ['exact'],
        'area': ['exact'],
        'cause': ['exact'],
        'probability': ['exact'],
        'client': ['exact'],
        'responsible_lawyer': ['exact'],
    }
    search_fields = [
        'cnj', 'court', 'jurisdiction', 'court_division', 'class_name', 'subject',
        'plaintiff', 'defendant', 'notes',
        'client__name', 'client__trade_name', 'client__doc', 'cause__name'
    ]
    ordering_fields = ['created_at', 'updated_at', 'status', 'cnj', 'cause_value', 'probability']
    ordering = ['-updated_at']

    def perform_create(self, serializer):
        # Billing: enforce process limit
        assert_can_create_process(self.request.tenant)
        return super().perform_create(serializer)

    @action(detail=True, methods=['get'], url_path='timeline')
    def timeline(self, request, pk=None):
        """Unified timeline feed for a process: movements + deadlines + hearings."""
        process = self.get_object()
        return Response(build_process_timeline(request.tenant, process))

    @action(detail=True, methods=['get', 'post'], url_path='documents')
    def documents(self, request, pk=None):
        """List/upload documents bound to this process.

        GET: lista documentos (por padrão, latest)
        POST: upload multipart (file obrigatório) e cria Document associado ao processo.
        """
        process = self.get_object()

        if request.method.lower() == 'get':
            qs = Document.objects.filter(tenant=request.tenant, process=process).order_by('-created_at')
            latest_param = request.query_params.get('latest')
            if latest_param is None:
                qs = qs.filter(is_latest=True)
            page = self.paginate_queryset(qs)
            if page is not None:
                return self.get_paginated_response(DocumentSerializer(page, many=True, context={'request': request}).data)
            return Response(DocumentSerializer(qs, many=True, context={'request': request}).data)

        serializer = DocumentUploadSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        file = serializer.validated_data['file']
        group_id = serializer.validated_data.get('group_id')

        # versão
        version = 1
        if group_id:
            max_ver = (
                Document.objects.filter(tenant=request.tenant, group_id=group_id)
                .aggregate(models.Max('version'))
                .get('version__max')
            )
            version = (int(max_ver) + 1) if max_ver else 1

        doc = Document.objects.create(
            tenant=request.tenant,
            group_id=group_id or uuid.uuid4(),
            title=serializer.validated_data.get('title') or getattr(file, 'name', 'documento'),
            category=serializer.validated_data.get('category') or 'geral',
            is_template=serializer.validated_data.get('is_template', False),
            access_level=serializer.validated_data.get('access_level', 'TENANT'),
            allowed_roles=serializer.validated_data.get('allowed_roles') or [],
            client=serializer.validated_data.get('client') or process.client,
            process=process,
            uploaded_by=request.user,
            filename=getattr(file, 'name', 'documento'),
            file=file,
            file_size=getattr(file, 'size', None),
            content_type=getattr(file, 'content_type', None),
            version=version,
            is_latest=True,
        )

        return Response(DocumentSerializer(doc, context={'request': request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get', 'post'], url_path='movements')
    def movements(self, request, pk=None):
        process = self.get_object()
        if request.method.lower() == 'get':
            qs = process.movements.all().order_by('-date', '-created_at')
            page = self.paginate_queryset(qs)
            ser = MovementSerializer(page if page is not None else qs, many=True, context={'request': request})
            if page is not None:
                return self.get_paginated_response(ser.data)
            return Response(ser.data)

        ser = MovementSerializer(data=request.data, context={'request': request})
        ser.is_valid(raise_exception=True)
        obj = ser.save(process=process, tenant=request.tenant, created_by=request.user)
        # Ensure nested create is audited (MovementViewSet is bypassed here)
        audit_event(
            tenant=request.tenant,
            actor=request.user,
            event_type='movement_created',
            entity_type='Movement',
            entity_id=obj.id,
            summary='Andamento criado',
            payload={'after': {'id': str(obj.id), 'process_id': str(process.id), 'type': obj.type, 'date': obj.date.isoformat()}},
        )
        return Response(ser.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get', 'post'], url_path='deadlines')
    def deadlines(self, request, pk=None):
        process = self.get_object()
        if request.method.lower() == 'get':
            qs = process.deadlines.all().order_by('due_date')
            page = self.paginate_queryset(qs)
            ser = DeadlineSerializer(page if page is not None else qs, many=True, context={'request': request})
            if page is not None:
                return self.get_paginated_response(ser.data)
            return Response(ser.data)

        ser = DeadlineSerializer(data=request.data, context={'request': request})
        ser.is_valid(raise_exception=True)
        obj = ser.save(process=process, tenant=request.tenant, created_by=request.user)
        audit_event(
            tenant=request.tenant,
            actor=request.user,
            event_type='deadline_created',
            entity_type='Deadline',
            entity_id=obj.id,
            summary='Prazo criado',
            payload={'after': {'id': str(obj.id), 'process_id': str(process.id), 'due_date': obj.due_date.isoformat(), 'status': obj.status, 'priority': obj.priority}},
        )
        return Response(ser.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get', 'post'], url_path='hearings')
    def hearings(self, request, pk=None):
        process = self.get_object()
        if request.method.lower() == 'get':
            qs = process.hearings.all().order_by('hearing_date')
            page = self.paginate_queryset(qs)
            ser = HearingSerializer(page if page is not None else qs, many=True, context={'request': request})
            if page is not None:
                return self.get_paginated_response(ser.data)
            return Response(ser.data)

        ser = HearingSerializer(data=request.data, context={'request': request})
        ser.is_valid(raise_exception=True)
        obj = ser.save(process=process, tenant=request.tenant, created_by=request.user)
        audit_event(
            tenant=request.tenant,
            actor=request.user,
            event_type='hearing_created',
            entity_type='Hearing',
            entity_id=obj.id,
            summary='Audiência criada',
            payload={'after': {'id': str(obj.id), 'process_id': str(process.id), 'hearing_date': obj.hearing_date.isoformat(), 'status': obj.status, 'modality': obj.modality}},
        )
        return Response(ser.data, status=status.HTTP_201_CREATED)


class MovementViewSet(TenantAuditedModelViewSet):
    queryset = Movement.objects.select_related('process').all().order_by('-date', '-created_at')
    serializer_class = MovementSerializer
    permission_classes = [IsTenantMember, IsLegal]

    audit_enabled = True
    audit_entity_type = 'Movement'

    filterset_fields = {'process': ['exact']}
    search_fields = ['type', 'description', 'process__cnj', 'process__subject']
    ordering_fields = ['date', 'created_at']
    ordering = ['-date', '-created_at']


class DeadlineViewSet(TenantAuditedModelViewSet):
    queryset = Deadline.objects.select_related('process', 'responsible').all().order_by('due_date')
    serializer_class = DeadlineSerializer
    permission_classes = [IsTenantMember, IsLegal]

    audit_enabled = True
    audit_entity_type = 'Deadline'

    filterset_fields = {'process': ['exact'], 'status': ['exact'], 'priority': ['exact'], 'responsible': ['exact']}
    search_fields = ['description', 'process__cnj', 'process__subject']
    ordering_fields = ['due_date', 'created_at', 'status', 'priority']
    ordering = ['due_date']


class HearingViewSet(TenantAuditedModelViewSet):
    queryset = Hearing.objects.select_related('process', 'responsible').all().order_by('hearing_date')
    serializer_class = HearingSerializer
    permission_classes = [IsTenantMember, IsLegal]

    audit_enabled = True
    audit_entity_type = 'Hearing'

    filterset_fields = {'process': ['exact'], 'status': ['exact'], 'modality': ['exact'], 'responsible': ['exact']}
    search_fields = ['type', 'location', 'notes', 'process__cnj', 'process__subject']
    ordering_fields = ['hearing_date', 'created_at', 'status']
    ordering = ['hearing_date']
