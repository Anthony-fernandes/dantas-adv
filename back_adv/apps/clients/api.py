from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import IsTenantMember, IsLegal
from apps.core.viewsets import TenantScopedModelViewSet
from apps.processes.models import Process
from apps.documents.models import Contract
from apps.finance.models import AccountsReceivable, Invoice, Payment
from .models import Client


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'created_at', 'updated_at')


class ClientRelatedProcessSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)

    class Meta:
        model = Process
        fields = [
            'id', 'cnj', 'court', 'jurisdiction', 'court_division', 'class_name', 'subject',
            'area', 'phase', 'status', 'cause_value', 'probability',
            'plaintiff', 'defendant', 'client_id', 'client_name',
            'created_at', 'updated_at',
        ]


class ClientRelatedContractSerializer(serializers.ModelSerializer):
    percent = serializers.DecimalField(source='percent', max_digits=5, decimal_places=2, read_only=True)
    valor_fixo = serializers.DecimalField(source='fixed_value', max_digits=15, decimal_places=2, read_only=True)
    start = serializers.DateField(source='start_date', read_only=True)
    end = serializers.DateField(source='end_date', read_only=True)

    class Meta:
        model = Contract
        fields = [
            'id', 'client_id', 'type', 'percent', 'valor_fixo', 'start', 'end',
            'clauses', 'status', 'created_at', 'updated_at',
        ]


class ClientFinancialEntrySerializer(serializers.Serializer):
    id = serializers.CharField()
    source = serializers.CharField()
    type = serializers.CharField()
    description = serializers.CharField()
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    due_date = serializers.DateField(required=False, allow_null=True)
    paid_date = serializers.DateField(required=False, allow_null=True)
    status = serializers.CharField()
    category = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    process_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    client_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    created_at = serializers.DateTimeField()


class ClientViewSet(TenantScopedModelViewSet):
    queryset = Client.objects.select_related('responsible_user', 'portal_user').all().order_by('-created_at')
    serializer_class = ClientSerializer
    permission_classes = [IsTenantMember, IsLegal]

    # Server-side list controls (PR11)
    filterset_fields = {
        'status': ['exact'],
        'type': ['exact'],
        'responsible_user': ['exact'],
    }
    search_fields = ['name', 'trade_name', 'doc', 'email', 'whatsapp', 'notes']
    ordering_fields = ['created_at', 'updated_at', 'name', 'status', 'type']
    ordering = ['-created_at']

    @action(detail=True, methods=['get'], url_path='processes')
    def processes(self, request, pk=None):
        client = self.get_object()
        qs = Process.objects.filter(tenant=request.tenant, client=client, deleted_at__isnull=True).order_by('-updated_at', '-created_at')
        page = self.paginate_queryset(qs)
        ser = ClientRelatedProcessSerializer(page or qs, many=True)
        return self.get_paginated_response(ser.data) if page is not None else Response(ser.data)

    @action(detail=True, methods=['get'], url_path='contracts')
    def contracts(self, request, pk=None):
        client = self.get_object()
        qs = Contract.objects.filter(tenant=request.tenant, client=client, deleted_at__isnull=True).order_by('-created_at')
        page = self.paginate_queryset(qs)
        ser = ClientRelatedContractSerializer(page or qs, many=True)
        return self.get_paginated_response(ser.data) if page is not None else Response(ser.data)

    @action(detail=True, methods=['get'], url_path='financial')
    def financial(self, request, pk=None):
        client = self.get_object()
        entries = []

        receivables = AccountsReceivable.objects.filter(
            tenant=request.tenant, client=client, deleted_at__isnull=True
        ).order_by('-created_at')
        invoices = Invoice.objects.filter(
            tenant=request.tenant, client=client, deleted_at__isnull=True
        ).order_by('-created_at')
        payments = Payment.objects.filter(
            tenant=request.tenant, client=client, deleted_at__isnull=True
        ).order_by('-created_at')

        for item in receivables:
            entries.append({
                'id': str(item.id),
                'source': 'receivable',
                'type': 'RECEITA',
                'description': item.description,
                'amount': item.amount,
                'due_date': item.due_date,
                'paid_date': item.paid_date,
                'status': item.status.upper(),
                'category': item.category,
                'process_id': str(item.process_id) if item.process_id else None,
                'client_id': str(item.client_id) if item.client_id else None,
                'created_at': item.created_at,
            })

        for item in invoices:
            entries.append({
                'id': str(item.id),
                'source': 'invoice',
                'type': item.type or 'FATURA',
                'description': f'Fatura {item.type}',
                'amount': item.amount,
                'due_date': item.due_date,
                'paid_date': None,
                'status': item.status.upper(),
                'category': 'invoice',
                'process_id': str(item.process_id) if item.process_id else None,
                'client_id': str(item.client_id) if item.client_id else None,
                'created_at': item.created_at,
            })

        for item in payments:
            entries.append({
                'id': str(item.id),
                'source': 'payment',
                'type': 'PAGAMENTO',
                'description': item.notes or f'Pagamento via {item.method}',
                'amount': item.amount,
                'due_date': item.payment_date,
                'paid_date': item.payment_date,
                'status': 'PAGO',
                'category': item.method,
                'process_id': str(item.process_id) if item.process_id else None,
                'client_id': str(item.client_id) if item.client_id else None,
                'created_at': item.created_at,
            })

        entries.sort(key=lambda value: value['created_at'], reverse=True)
        page = self.paginate_queryset(entries)
        ser = ClientFinancialEntrySerializer(page or entries, many=True)
        return self.get_paginated_response(ser.data) if page is not None else Response(ser.data)
