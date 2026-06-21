from django.db import connection, models
from django.db.models import Q
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import NotFound

from apps.core.permissions import IsTenantMember, IsLegal
from apps.core.viewsets import TenantScopedModelViewSet
from apps.accounts.models import UserRole
from django.core.files.base import ContentFile

from .models import Document, Contract, JobPosition, LegalTemplate, ProcessRichDocument, TemplateFormat, SignatureRequest
from .services import RenderContext, build_template_context, render_rich_text, htmlish_to_pdf_bytes


class DocumentSerializer(serializers.ModelSerializer):
    file_download_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = '__all__'
        read_only_fields = (
            'id', 'tenant', 'created_at', 'uploaded_by', 'file_size', 'content_type', 'is_latest',
        )

    def get_file_download_url(self, obj: Document):
        if obj.file:
            try:
                return obj.file.url
            except Exception:
                return None
        return obj.file_url


class DocumentUploadSerializer(serializers.ModelSerializer):
    file = serializers.FileField(required=True)
    group_id = serializers.UUIDField(required=False)
    title = serializers.CharField(required=True, allow_blank=False)
    category = serializers.CharField(required=True, allow_blank=False)

    class Meta:
        model = Document
        fields = (
            'id',
            'group_id',
            'title',
            'category',
            'is_template',
            'access_level',
            'allowed_roles',
            'client',
            'process',
            'file',
        )
        read_only_fields = ('id',)

    def validate(self, attrs):
        request = self.context.get('request')
        tenant = getattr(request, 'tenant', None)
        if tenant is None:
            return attrs

        client = attrs.get('client')
        proc = attrs.get('process')
        if client and client.tenant_id != tenant.id:
            raise serializers.ValidationError({'client': 'Cliente nÃ£o pertence ao tenant.'})
        if proc and proc.tenant_id != tenant.id:
            raise serializers.ValidationError({'process': 'Processo nÃ£o pertence ao tenant.'})

        # Multipart can send JSON as string
        allowed_roles = attrs.get('allowed_roles')
        if isinstance(allowed_roles, str):
            import json
            try:
                allowed_roles = json.loads(allowed_roles)
            except Exception:
                allowed_roles = [r.strip() for r in allowed_roles.split(',') if r.strip()]
        attrs['allowed_roles'] = allowed_roles or []

        access_level = attrs.get('access_level', Document.access_level.field.default)
        allowed_roles = attrs.get('allowed_roles') or []
        if access_level == 'ROLES' and not allowed_roles:
            raise serializers.ValidationError({'allowed_roles': 'Informe ao menos uma role quando access_level=ROLES.'})
        return attrs


class DocumentPagination(PageNumberPagination):
    page_size_query_param = 'page_size'
    max_page_size = 100


class ContractSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contract
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'created_at', 'updated_at')


class JobPositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobPosition
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'created_at')


class DocumentViewSet(TenantScopedModelViewSet):
    queryset = Document.objects.all().order_by('-created_at')
    serializer_class = DocumentSerializer
    permission_classes = [IsTenantMember, IsLegal]
    parser_classes = [MultiPartParser, FormParser]
    pagination_class = DocumentPagination

    filterset_fields = ['process', 'client', 'category', 'is_template', 'group_id', 'is_latest']
    search_fields = ['title', 'filename']
    ordering_fields = ['created_at', 'category', 'version', 'filename', 'title']

    def get_queryset(self):
        qs = super().get_queryset()
        request = self.request
        latest_param = request.query_params.get('latest')
        if latest_param is None:
            qs = qs.filter(is_latest=True)
        else:
            latest_flag = str(latest_param).strip().lower()
            if latest_flag in {'1', 'true', 't', 'yes', 'y', 'sim'}:
                qs = qs.filter(is_latest=True)
            elif latest_flag in {'0', 'false', 'f', 'no', 'n', 'nao', 'não'}:
                qs = qs.filter(is_latest=False)

        tenant = getattr(request, 'tenant', None)
        if tenant is None or not request.user.is_authenticated:
            return qs.none()

        roles = list(
            UserRole.objects.filter(user=request.user, tenant=tenant).values_list('role', flat=True)
        )
        # acesso_level=TENANT Ã© visÃ­vel para todos do tenant.
        if connection.vendor == 'sqlite':
            base = qs.filter(access_level__in=['TENANT', 'ROLES'])
            allowed_ids = [
                obj.id for obj in base
                if obj.access_level == 'TENANT' or any(r in (obj.allowed_roles or []) for r in roles)
            ]
            return qs.filter(id__in=allowed_ids)

        q = Q(access_level='TENANT')
        for r in roles:
            q |= Q(access_level='ROLES', allowed_roles__contains=[r])
        return qs.filter(q)

    def get_serializer_class(self):
        if self.action in ('create', 'new_version'):
            return DocumentUploadSerializer
        return DocumentSerializer

    def perform_create(self, serializer):
        file = serializer.validated_data.get('file')
        instance: Document = serializer.save(
            tenant=self.request.tenant,
            uploaded_by=self.request.user,
            filename=getattr(file, 'name', serializer.validated_data.get('title') or 'documento'),
            file_size=getattr(file, 'size', None),
            content_type=getattr(file, 'content_type', None),
            is_latest=True,
        )
        # versionamento por group_id
        if instance.group_id:
            max_ver = (
                Document.objects.filter(tenant=self.request.tenant, group_id=instance.group_id)
                .exclude(id=instance.id)
                .aggregate(models.Max('version'))
                .get('version__max')
            )
            if max_ver:
                instance.version = int(max_ver) + 1
                instance.save(update_fields=['version'])

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        response_serializer = DocumentSerializer(serializer.instance, context=self.get_serializer_context())
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'], url_path='new-version')
    def new_version(self, request, pk=None):
        base: Document = self.get_object()
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        file = serializer.validated_data.get('file')
        doc = Document.objects.create(
            tenant=request.tenant,
            group_id=base.group_id,
            title=serializer.validated_data.get('title') or base.title,
            category=serializer.validated_data.get('category') or base.category,
            is_template=serializer.validated_data.get('is_template', base.is_template),
            access_level=serializer.validated_data.get('access_level', base.access_level),
            allowed_roles=serializer.validated_data.get('allowed_roles') or base.allowed_roles,
            client=serializer.validated_data.get('client') or base.client,
            process=serializer.validated_data.get('process') or base.process,
            uploaded_by=request.user,
            filename=getattr(file, 'name', base.filename),
            file=file,
            file_size=getattr(file, 'size', None),
            content_type=getattr(file, 'content_type', None),
            is_latest=True,
        )
        max_ver = (
            Document.objects.filter(tenant=request.tenant, group_id=base.group_id)
            .exclude(id=doc.id)
            .aggregate(models.Max('version'))
            .get('version__max')
        )
        doc.version = (int(max_ver) + 1) if max_ver else 1
        doc.save(update_fields=['version'])
        return Response(DocumentSerializer(doc, context={'request': request}).data, status=status.HTTP_201_CREATED)


class ContractViewSet(TenantScopedModelViewSet):
    queryset = Contract.objects.all().order_by('-created_at')
    serializer_class = ContractSerializer
    permission_classes = [IsTenantMember, IsLegal]


class JobPositionViewSet(TenantScopedModelViewSet):
    queryset = JobPosition.objects.all().order_by('name')
    serializer_class = JobPositionSerializer
    permission_classes = [IsTenantMember, IsLegal]


class LegalTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LegalTemplate
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'created_at', 'updated_at', 'created_by', 'updated_by', 'is_latest')


class LegalTemplateCreateSerializer(serializers.ModelSerializer):
    group_id = serializers.UUIDField(required=False)
    allowed_roles = serializers.JSONField(required=False)

    class Meta:
        model = LegalTemplate
        fields = (
            'id', 'group_id', 'name', 'description', 'category', 'format', 'content',
            'access_level', 'allowed_roles'
        )
        read_only_fields = ('id',)

    def validate(self, attrs):
        allowed_roles = attrs.get('allowed_roles')
        if isinstance(allowed_roles, str):
            import json
            try:
                allowed_roles = json.loads(allowed_roles)
            except Exception:
                allowed_roles = [r.strip() for r in allowed_roles.split(',') if r.strip()]
        attrs['allowed_roles'] = allowed_roles or []

        access_level = attrs.get('access_level', LegalTemplate.access_level.field.default)
        if access_level == 'ROLES' and not attrs['allowed_roles']:
            raise serializers.ValidationError({'allowed_roles': 'Informe ao menos uma role quando access_level=ROLES.'})
        return attrs


class LegalTemplateViewSet(TenantScopedModelViewSet):
    serializer_class = LegalTemplateSerializer
    permission_classes = [IsTenantMember, IsLegal]
    filterset_fields = ['category', 'format', 'is_latest', 'access_level']
    search_fields = ['name', 'description', 'category', 'content']
    ordering_fields = ['created_at', 'updated_at', 'name', 'category', 'version']

    def get_queryset(self):
        qs = LegalTemplate.objects.filter(
            tenant=self.request.tenant,
            deleted_at__isnull=True,
        )
        latest_param = self.request.query_params.get('latest')
        if latest_param is None:
            qs = qs.filter(is_latest=True)
        elif str(latest_param).strip().lower() in {'1', 'true', 't', 'yes'}:
            qs = qs.filter(is_latest=True)
        return qs.order_by('-created_at')

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return LegalTemplateCreateSerializer
        return LegalTemplateSerializer

    def perform_create(self, serializer):
        data = serializer.validated_data
        group_id = data.get('group_id') or None
        existing_version = 0
        if group_id:
            existing_version = LegalTemplate.objects.filter(
                tenant=self.request.tenant, group_id=group_id
            ).aggregate(models.Max('version')).get('version__max') or 0
        serializer.save(
            tenant=self.request.tenant,
            created_by=self.request.user,
            updated_by=self.request.user,
            is_latest=True,
            version=int(existing_version) + 1,
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        import django.utils.timezone as tz
        obj = self.get_object()
        obj.deleted_at = tz.now()
        obj.save(update_fields=['deleted_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'], url_path='versions')
    def versions(self, request, *args, **kwargs):
        obj = self.get_object()
        qs = LegalTemplate.objects.filter(
            tenant=request.tenant,
            group_id=obj.group_id,
            deleted_at__isnull=True,
        ).order_by('-version')
        return Response(LegalTemplateSerializer(qs, many=True).data)


class TemplateGenerateSerializer(serializers.Serializer):
    process_id = serializers.UUIDField(required=False, allow_null=True)
    client_id = serializers.UUIDField(required=False, allow_null=True)
    title = serializers.CharField(required=False, allow_blank=True)
    category = serializers.CharField(required=False, allow_blank=True)
    access_level = serializers.ChoiceField(choices=Document.access_level.field.choices, required=False)
    allowed_roles = serializers.JSONField(required=False)


def _flatten_keys(obj, prefix=''):
    if isinstance(obj, dict):
        out = []
        for k, v in obj.items():
            p = f"{prefix}.{k}" if prefix else str(k)
            out.append(p)
            out.extend(_flatten_keys(v, p))
        return out
    return []


class ProcessRichDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcessRichDocument
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'created_at', 'updated_at', 'created_by', 'updated_by', 'is_latest', 'version')

    def validate(self, attrs):
        request = self.context.get('request')
        tenant = getattr(request, 'tenant', None) if request else None
        if tenant is None:
            return attrs

        process = attrs.get('process')
        client = attrs.get('client')
        if process and process.tenant_id != tenant.id:
            raise serializers.ValidationError({'process': 'Processo nÃ£o pertence ao tenant.'})
        if client and client.tenant_id != tenant.id:
            raise serializers.ValidationError({'client': 'Cliente nÃ£o pertence ao tenant.'})

        access_level = attrs.get('access_level')
        allowed_roles = attrs.get('allowed_roles') or []
        if access_level == 'ROLES' and not allowed_roles:
            raise serializers.ValidationError({'allowed_roles': 'Informe ao menos uma role quando access_level=ROLES.'})
        return attrs


class ProcessRichDocumentViewSet(TenantScopedModelViewSet):
    queryset = ProcessRichDocument.objects.all().order_by('-created_at')
    serializer_class = ProcessRichDocumentSerializer
    permission_classes = [IsTenantMember, IsLegal]

    filterset_fields = ['process', 'client', 'category', 'group_id', 'is_latest', 'status', 'access_level']
    search_fields = ['title', 'category', 'content_html']
    ordering_fields = ['created_at', 'updated_at', 'category', 'version', 'title']

    def get_queryset(self):
        qs = super().get_queryset()
        request = self.request
        latest_param = request.query_params.get('latest')
        if latest_param is None:
            qs = qs.filter(is_latest=True)
        else:
            latest_flag = str(latest_param).strip().lower()
            if latest_flag in {'1', 'true', 't', 'yes', 'y', 'sim'}:
                qs = qs.filter(is_latest=True)
            elif latest_flag in {'0', 'false', 'f', 'no', 'n', 'nao', 'não'}:
                qs = qs.filter(is_latest=False)

        tenant = getattr(request, 'tenant', None)
        if tenant is None or not request.user.is_authenticated:
            return qs.none()

        roles = list(UserRole.objects.filter(user=request.user, tenant=tenant).values_list('role', flat=True))
        if connection.vendor == 'sqlite':
            base = qs.filter(access_level__in=['TENANT', 'ROLES'])
            allowed_ids = [
                obj.id for obj in base
                if obj.access_level == 'TENANT' or any(r in (obj.allowed_roles or []) for r in roles)
            ]
            return qs.filter(id__in=allowed_ids)

        q = Q(access_level='TENANT')
        for r in roles:
            q |= Q(access_level='ROLES', allowed_roles__contains=[r])
        return qs.filter(q)

    def perform_create(self, serializer):
        obj = serializer.save(
            tenant=self.request.tenant,
            created_by=self.request.user,
            updated_by=self.request.user,
            is_latest=True,
        )
        if obj.group_id:
            max_ver = (
                ProcessRichDocument.objects.filter(tenant=self.request.tenant, group_id=obj.group_id)
                .exclude(id=obj.id)
                .aggregate(models.Max('version'))
                .get('version__max')
            )
            if max_ver:
                obj.version = int(max_ver) + 1
                obj.save(update_fields=['version'])

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=['get'], url_path='placeholders')
    def placeholders(self, request):
        sample = build_template_context(RenderContext(tenant=request.tenant, user=request.user, client=None, process=None))
        keys = sorted(set(_flatten_keys(sample)))
        return Response({'placeholders': keys})

    @action(detail=True, methods=['post'], url_path='preview')
    def preview(self, request, pk=None):
        try:
            doc = self.get_object()
            ctx = build_template_context(
                RenderContext(
                    tenant=request.tenant,
                    user=request.user,
                    client=doc.client,
                    process=doc.process,
                )
            )
            rendered = render_rich_text(doc.content_html, ctx)
            return Response({'id': str(doc.id), 'title': doc.title, 'rendered_html': rendered})
        except Exception as exc:
            return Response({'detail': f'Falha ao renderizar preview: {exc}'}, status=status.HTTP_400_BAD_REQUEST)


    @action(detail=True, methods=['post'], url_path='new-version')
    def new_version(self, request, pk=None):
        base = self.get_object()
        payload = {
            'title': request.data.get('title') or base.title,
            'category': request.data.get('category') or base.category,
            'content_html': request.data.get('content_html') if request.data.get('content_html') is not None else base.content_html,
            'status': request.data.get('status') or base.status,
            'access_level': request.data.get('access_level') or base.access_level,
            'allowed_roles': request.data.get('allowed_roles') if request.data.get('allowed_roles') is not None else base.allowed_roles,
            'process': request.data.get('process') if request.data.get('process') is not None else (str(base.process_id) if base.process_id else None),
            'client': request.data.get('client') if request.data.get('client') is not None else (str(base.client_id) if base.client_id else None),
        }
        serializer = self.get_serializer(data=payload)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save(
            tenant=request.tenant,
            group_id=base.group_id,
            created_by=request.user,
            updated_by=request.user,
            is_latest=True,
        )
        max_ver = (
            ProcessRichDocument.objects.filter(tenant=request.tenant, group_id=base.group_id)
            .exclude(id=obj.id)
            .aggregate(models.Max('version'))
            .get('version__max')
        )
        obj.version = (int(max_ver) + 1) if max_ver else 1
        obj.save(update_fields=['version'])
        return Response(ProcessRichDocumentSerializer(obj).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='export-pdf')
    def export_pdf(self, request, pk=None):
        try:
            doc = self.get_object()
            title = request.data.get('title') or doc.title
            category = request.data.get('category') or 'editor_generated'

            ctx = build_template_context(
                RenderContext(
                    tenant=request.tenant,
                    user=request.user,
                    client=doc.client,
                    process=doc.process,
                )
            )
            rendered = render_rich_text(doc.content_html, ctx)
            pdf_bytes = htmlish_to_pdf_bytes(title=title, rendered=rendered)

            filename = f"{title}.pdf".replace('/', '-')
            content_file = ContentFile(pdf_bytes, name=filename)

            pdf_doc = Document.objects.create(
                tenant=request.tenant,
                process=doc.process,
                client=doc.client,
                title=title,
                category=category,
                is_template=False,
                access_level=doc.access_level,
                allowed_roles=doc.allowed_roles,
                uploaded_by=request.user,
                filename=filename,
                file=content_file,
                file_size=len(pdf_bytes),
                content_type='application/pdf',
                is_latest=True,
            )
            return Response(DocumentSerializer(pdf_doc, context={'request': request}).data, status=status.HTTP_201_CREATED)
        except Exception as exc:
            return Response({'detail': f'Falha ao exportar PDF: {exc}'}, status=status.HTTP_400_BAD_REQUEST)






class SignatureRequestSignerSerializer(serializers.Serializer):
    name = serializers.CharField()
    email = serializers.EmailField()
    role = serializers.CharField(default='party')


class SignatureRequestSerializer(serializers.ModelSerializer):
    signers = SignatureRequestSignerSerializer(many=True, required=True)

    class Meta:
        model = SignatureRequest
        fields = ('id', 'document', 'provider', 'deadline', 'status', 'signing_url', 'signers', 'created_at')
        read_only_fields = ('id', 'status', 'signing_url', 'created_at')

    def create(self, validated_data):
        signers = validated_data.pop('signers')
        return SignatureRequest.objects.create(
            **validated_data,
            signers=signers,
            status=SignatureRequest.Status.SENT,
        )


class SignatureRequestViewSet(TenantScopedModelViewSet):
    serializer_class = SignatureRequestSerializer
    permission_classes = [IsTenantMember]
    filterset_fields = ['document', 'status', 'provider']
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        return SignatureRequest.objects.filter(tenant=self.request.tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.tenant, created_by=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = self.perform_create(serializer)
        return Response(
            {
                'id': str(serializer.instance.id),
                'status': serializer.instance.status,
                'message': f'Solicitação enviada para {len(serializer.instance.signers)} signatário(s) via {serializer.instance.provider}.',
                'signing_url': serializer.instance.signing_url,
            },
            status=status.HTTP_201_CREATED,
        )
