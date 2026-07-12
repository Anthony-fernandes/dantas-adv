from __future__ import annotations

from dataclasses import dataclass

from django.db.models import Q
from rest_framework import generics, permissions, serializers
from rest_framework.response import Response

from apps.accounts.models import UserRole, AppRole
from apps.clients.models import Client
from apps.chat.models import ChatMessage
from apps.documents.models import Document, DocumentAccess
from apps.processes.models import Process
from apps.core.permissions import IsClient


class PortalMeSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    email = serializers.EmailField()
    full_name = serializers.CharField(allow_blank=True, required=False)
    tenant = serializers.DictField()
    role = serializers.CharField()


class PortalMeView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated, IsClient]

    def get(self, request, *args, **kwargs):
        tenant = request.tenant
        role = UserRole.objects.filter(user=request.user, tenant=tenant).values_list('role', flat=True).first() or AppRole.CLIENT
        payload = {
            'id': request.user.id,
            'email': request.user.email,
            'full_name': getattr(request.user, 'full_name', '') or getattr(request.user, 'get_full_name', lambda: '')(),
            'tenant': {'id': tenant.id, 'name': tenant.name, 'slug': tenant.slug},
            'role': role,
        }
        return Response(PortalMeSerializer(payload).data)


class PortalDashboardView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated, IsClient]

    def get(self, request, *args, **kwargs):
        from django.utils import timezone
        from datetime import timedelta
        from apps.processes.models import Deadline, Hearing

        tenant = request.tenant
        qs = Process.objects.filter(tenant=tenant, client__portal_user=request.user)
        now = timezone.now().date()
        next_7 = now + timedelta(days=7)
        next_14 = now + timedelta(days=14)

        active_count = qs.exclude(status__in=['ARCHIVED', 'CLOSED']).count()
        deadlines = (
            Deadline.objects
            .filter(tenant=tenant, process__in=qs, due_date__gte=now, due_date__lte=next_7)
            .order_by('due_date')
            .select_related('process')
        )[:10]
        hearings = (
            Hearing.objects
            .filter(tenant=tenant, process__in=qs, hearing_date__date__gte=now, hearing_date__date__lte=next_14)
            .order_by('hearing_date')
            .select_related('process')
        )[:10]
        docs_count = Document.objects.filter(tenant=tenant, process__in=qs, is_latest=True).count()

        return Response({
            'active_processes': active_count,
            'documents': docs_count,
            'upcoming_deadlines': [
                {
                    'id': str(d.id),
                    'due_date': d.due_date.isoformat(),
                    'description': d.description,
                    'status': d.status,
                    'priority': d.priority,
                    'process': {'id': str(d.process_id), 'cnj': d.process.cnj, 'title': d.process.title},
                }
                for d in deadlines
            ],
            'upcoming_hearings': [
                {
                    'id': str(h.id),
                    'hearing_date': h.hearing_date.isoformat(),
                    'type': h.type,
                    'status': h.status,
                    'process': {'id': str(h.process_id), 'cnj': h.process.cnj, 'title': h.process.title},
                }
                for h in hearings
            ],
        })


class PortalProcessListSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    title = serializers.CharField(read_only=True)

    class Meta:
        model = Process
        fields = [
            'id',
            'title',
            'cnj',
            'status',
            'phase',
            'area',
            'created_at',
            'updated_at',
            'client',
            'client_name',
        ]


class PortalProcessDetailSerializer(serializers.ModelSerializer):
    client = serializers.SerializerMethodField()
    title = serializers.CharField(read_only=True)

    class Meta:
        model = Process
        fields = [
            'id',
            'title',
            'cnj',
            'status',
            'phase',
            'area',
            'notes',
            'created_at',
            'updated_at',
            'client',
        ]

    def get_client(self, obj: Process):
        if not obj.client_id:
            return None
        c = obj.client
        return {
            'id': c.id,
            'name': c.name,
            'type': getattr(c, 'type', None),
            'doc': getattr(c, 'doc', None),
        }


class PortalProcessBase:
    """Shared queryset constraint for portal users."""

    def get_queryset(self):
        tenant = self.request.tenant
        # Client can only see processes linked to a client whose portal_user is the current user.
        return (
            Process.objects
            .filter(tenant=tenant, client__portal_user=self.request.user)
            .select_related('client')
        )


class PortalProcessListView(PortalProcessBase, generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsClient]
    serializer_class = PortalProcessListSerializer
    search_fields = ['subject', 'cnj', 'client__name']
    ordering_fields = ['updated_at', 'created_at', 'status', 'subject']
    ordering = ['-updated_at']


class PortalProcessDetailView(PortalProcessBase, generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated, IsClient]
    serializer_class = PortalProcessDetailSerializer


class PortalTimelineView(PortalProcessBase, generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated, IsClient]

    def get(self, request, *args, **kwargs):
        process = self.get_object()
        # Reuse the existing timeline serializer logic from ProcessViewSet by calling its method would be tightly coupled.
        # Instead, return a minimal, stable payload that matches the UI.
        from apps.processes.api import build_process_timeline

        return Response(build_process_timeline(request.tenant, process))


class PortalDocumentSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id',
            'title',
            'filename',
            'category',
            'content_type',
            'file_size',
            'group_id',
            'version',
            'is_latest',
            'created_at',
            'download_url',
        ]

    def get_download_url(self, obj: Document):
        # Download SEMPRE via endpoint autenticado do portal (escopo por cliente).
        if obj.file:
            return f"/api/portal/documents/{obj.id}/download/"
        return obj.file_url


class PortalDocumentsView(PortalProcessBase, generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsClient]
    serializer_class = PortalDocumentSerializer
    ordering = ['-created_at']

    def get_queryset(self):
        process = self.get_object()
        tenant = self.request.tenant
        role = AppRole.CLIENT
        # allow document when TENANT, or ROLES includes CLIENT
        role_filter = Q(access_level=DocumentAccess.TENANT) | (
            Q(access_level=DocumentAccess.ROLES) & Q(allowed_roles__contains=[role])
        )
        return (
            Document.objects
            .filter(tenant=tenant, process=process, is_latest=True)
            .filter(role_filter)
            .order_by('-created_at')
        )


class PortalDocumentDownloadView(generics.GenericAPIView):
    """Download de documento pelo cliente do portal.

    Só permite arquivos de processos vinculados ao cliente autenticado e que
    sejam visíveis para a role CLIENT (mesma regra da listagem).
    """

    permission_classes = [permissions.IsAuthenticated, IsClient]

    def get(self, request, pk=None, *args, **kwargs):
        from django.http import FileResponse, Http404

        tenant = request.tenant
        role_filter = Q(access_level=DocumentAccess.TENANT) | (
            Q(access_level=DocumentAccess.ROLES) & Q(allowed_roles__contains=[AppRole.CLIENT])
        )
        doc = (
            Document.objects
            .filter(tenant=tenant, process__client__portal_user=request.user)
            .filter(role_filter)
            .filter(pk=pk)
            .first()
        )
        if doc is None:
            raise Http404
        if not doc.file:
            if doc.file_url:
                return Response({'redirect': doc.file_url})
            raise Http404
        try:
            handle = doc.file.open('rb')
        except FileNotFoundError:
            raise Http404
        filename = doc.filename or doc.file.name.rsplit('/', 1)[-1]
        resp = FileResponse(handle, as_attachment=True, filename=filename)
        if doc.content_type:
            resp['Content-Type'] = doc.content_type
        return resp


class PortalFinancialView(generics.GenericAPIView):
    """Returns invoices/receivables scoped to the authenticated portal client."""
    permission_classes = [permissions.IsAuthenticated, IsClient]

    def get(self, request, *args, **kwargs):
        from apps.finance.models import AccountsReceivable, Invoice

        tenant = request.tenant
        client = Client.objects.filter(tenant=tenant, portal_user=request.user).first()
        if client is None:
            return Response({'invoices': [], 'receivables': []})

        invoices = list(
            Invoice.objects
            .filter(tenant=tenant, client=client)
            .order_by('-due_date')
            .values('id', 'description', 'amount', 'due_date', 'status', 'issue_date', 'paid_at')
        )
        receivables = list(
            AccountsReceivable.objects
            .filter(tenant=tenant, client=client)
            .order_by('-due_date')
            .values('id', 'description', 'amount', 'due_date', 'status', 'paid_date', 'category')
        )

        def str_id(row):
            row['id'] = str(row['id'])
            return row

        return Response({
            'invoices': [str_id(r) for r in invoices],
            'receivables': [str_id(r) for r in receivables],
        })


class PortalMessageSerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = ['id', 'sender', 'sender_name', 'content', 'created_at']

    def get_sender(self, obj: ChatMessage):
        user = self.context['request'].user
        return 'CLIENT' if obj.sender_id == user.id else 'OFFICE'

    def get_sender_name(self, obj: ChatMessage):
        profile = getattr(obj.sender, 'profile', None)
        full_name = getattr(profile, 'full_name', None)
        return full_name or obj.sender.email


class PortalMessageCreateSerializer(serializers.Serializer):
    content = serializers.CharField(max_length=5000)


class PortalMessagesView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated, IsClient]

    def _base_queryset(self, request):
        tenant = request.tenant
        return (
            ChatMessage.objects
            .filter(tenant=tenant, client__portal_user=request.user)
            .select_related('sender')
            .order_by('-created_at')
        )

    def get(self, request, *args, **kwargs):
        qs = self._base_queryset(request)
        page = self.paginate_queryset(qs)
        serializer = PortalMessageSerializer(page if page is not None else qs, many=True, context={'request': request})
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        serializer = PortalMessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        tenant = request.tenant
        client = Client.objects.filter(tenant=tenant, portal_user=request.user).order_by('created_at').first()
        if client is None:
            raise serializers.ValidationError({'detail': 'Client profile not found for portal user.'})

        msg = ChatMessage.objects.create(
            tenant=tenant,
            client=client,
            sender=request.user,
            content=serializer.validated_data['content'].strip(),
        )
        return Response(PortalMessageSerializer(msg, context={'request': request}).data, status=201)


class PortalMovementSerializer(serializers.ModelSerializer):
    class Meta:
        from apps.processes.models import Movement
        model = Movement
        fields = ['id', 'description', 'date', 'type', 'created_at']


class PortalMovementsView(PortalProcessBase, generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsClient]
    ordering = ['-date', '-created_at']

    def get_serializer_class(self):
        from rest_framework import serializers as s
        from apps.processes.models import Movement

        class Ser(s.ModelSerializer):
            class Meta:
                model = Movement
                fields = ['id', 'description', 'date', 'type', 'created_at']
        return Ser

    def get_queryset(self):
        process = self.get_object()
        from apps.processes.models import Movement
        return Movement.objects.filter(
            tenant=self.request.tenant,
            process=process,
        ).order_by('-date', '-created_at')


class PortalDocumentUploadView(PortalProcessBase, generics.GenericAPIView):
    """Upload de documento pelo cliente do portal.

    POST /api/portal/processes/<pk>/documents/upload/  (multipart)
    Campos: file (obrigatório), title (opcional — usa o nome do arquivo).
    O documento entra com categoria 'portal' e visibilidade TENANT, e o
    escritório é notificado — fluxo que evita o recebimento por WhatsApp.
    """

    permission_classes = [permissions.IsAuthenticated, IsClient]

    MAX_UPLOAD_BYTES = 25 * 1024 * 1024  # 25 MB

    def post(self, request, pk=None):
        process = self.get_object()
        uploaded = request.FILES.get('file')
        if not uploaded:
            return Response({'detail': 'Envie o arquivo no campo "file".'}, status=400)
        if uploaded.size and uploaded.size > self.MAX_UPLOAD_BYTES:
            return Response({'detail': 'Arquivo excede o limite de 25 MB.'}, status=400)

        title = (request.data.get('title') or '').strip() or uploaded.name

        document = Document.objects.create(
            tenant=request.tenant,
            process=process,
            client=process.client,
            title=title,
            filename=uploaded.name,
            file=uploaded,
            file_size=uploaded.size,
            content_type=getattr(uploaded, 'content_type', None),
            category='portal',
            access_level=DocumentAccess.TENANT,
            uploaded_by=request.user,
        )

        from apps.core.services.audit import audit_event
        audit_event(
            tenant=request.tenant,
            actor=request.user,
            event_type='portal.document_uploaded',
            entity_type='Document',
            entity_id=document.id,
            summary=f'Cliente enviou "{title}" pelo portal',
            payload={'process_id': str(process.id), 'filename': uploaded.name, 'size': uploaded.size},
        )

        try:
            from django.contrib.auth import get_user_model
            from apps.notifications.services import NotificationSpec, notify_users
            from apps.accounts.models import UserRole as _UserRole

            legal_ids = list(
                _UserRole.objects.filter(
                    tenant=request.tenant,
                    role__in=[AppRole.OWNER, AppRole.ADMIN, AppRole.LAWYER, AppRole.ASSISTANT],
                ).values_list('user_id', flat=True).distinct()
            )
            users = get_user_model().objects.filter(id__in=legal_ids)
            if users:
                notify_users(
                    tenant=request.tenant,
                    users=users,
                    spec=NotificationSpec(
                        type='document',
                        title='Documento recebido pelo portal',
                        message=f'{process.client.name if process.client else "Cliente"} enviou "{title}" no processo {process.cnj or process.title}.',
                        payload={'process_id': str(process.id), 'document_id': str(document.id)},
                    ),
                )
        except Exception:
            pass

        return Response(
            {
                'id': str(document.id),
                'title': document.title,
                'filename': document.filename,
                'category': document.category,
                'created_at': document.created_at.isoformat(),
            },
            status=201,
        )


class PortalContractsView(generics.ListAPIView):
    """Contratos do cliente autenticado no portal (somente leitura)."""

    permission_classes = [permissions.IsAuthenticated, IsClient]

    def get_serializer_class(self):
        from rest_framework import serializers as s
        from apps.documents.models import Contract

        class Ser(s.ModelSerializer):
            class Meta:
                model = Contract
                fields = ['id', 'type', 'percent', 'fixed_value', 'start_date', 'end_date', 'status', 'clauses', 'created_at']
        return Ser

    def get_queryset(self):
        from apps.documents.models import Contract
        tenant = self.request.tenant
        return (
            Contract.objects
            .filter(tenant=tenant, client__portal_user=self.request.user, deleted_at__isnull=True)
            .order_by('-start_date', '-created_at')
        )
