from __future__ import annotations

import csv
import io
from datetime import date, timedelta
from decimal import Decimal

from django.http import HttpResponse
from django.utils import timezone
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsTenantMember, IsFinance
from apps.core.viewsets import TenantAuditedModelViewSet
from .models import (
    AccountsReceivable,
    AccountsPayable,
    Invoice,
    Payment,
    ReceivableInstallment,
    FinancialStatus,
)


class _TenantFKValidationMixin:
    """Defense-in-depth: prevent cross-tenant FK injection in payloads."""

    def _validate_fk_tenant(self, obj, *, field_name: str):
        if obj is None:
            return
        req = self.context.get('request')
        tenant = getattr(req, 'tenant', None) if req else None
        if tenant is None:
            return
        if getattr(obj, 'tenant_id', None) != tenant.id:
            raise serializers.ValidationError({field_name: 'Entidade não pertence ao tenant atual.'})


class ReceivableInstallmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReceivableInstallment
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'receivable', 'created_at', 'updated_at')


class AccountsReceivableSerializer(_TenantFKValidationMixin, serializers.ModelSerializer):
    installments = ReceivableInstallmentSerializer(many=True, read_only=True)

    # write-only helpers for generation
    installments_count = serializers.IntegerField(required=False, allow_null=True, write_only=True)
    installment_interval_days = serializers.IntegerField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = AccountsReceivable
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'created_by', 'updated_by', 'created_at', 'updated_at')

    def validate(self, attrs):
        attrs = super().validate(attrs)
        self._validate_fk_tenant(attrs.get('client'), field_name='client')
        self._validate_fk_tenant(attrs.get('process'), field_name='process')

        count = attrs.get('installments_count')
        interval = attrs.get('installment_interval_days')
        if count is not None:
            if count < 1 or count > 120:
                raise serializers.ValidationError({'installments_count': 'Quantidade de parcelas inválida.'})
            if interval is None:
                attrs['installment_interval_days'] = 30
            elif interval < 1 or interval > 365:
                raise serializers.ValidationError({'installment_interval_days': 'Intervalo de parcelas inválido.'})
        return attrs


class AccountsPayableSerializer(_TenantFKValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = AccountsPayable
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'created_by', 'updated_by', 'created_at', 'updated_at')

    def validate(self, attrs):
        attrs = super().validate(attrs)
        self._validate_fk_tenant(attrs.get('process'), field_name='process')
        self._validate_fk_tenant(attrs.get('employee'), field_name='employee')
        return attrs


class InvoiceSerializer(_TenantFKValidationMixin, serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'created_by', 'updated_by', 'created_at', 'updated_at')

    def validate(self, attrs):
        attrs = super().validate(attrs)
        self._validate_fk_tenant(attrs.get('client'), field_name='client')
        self._validate_fk_tenant(attrs.get('process'), field_name='process')
        return attrs


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ('id', 'tenant', 'created_by', 'created_at')

    def validate(self, attrs):
        attrs = super().validate(attrs)
        req = self.context.get('request')
        tenant = getattr(req, 'tenant', None) if req else None
        if tenant is None:
            return attrs

        for field_name in ('invoice', 'receivable', 'client', 'process', 'installment'):
            obj = attrs.get(field_name)
            if obj is None:
                continue
            if getattr(obj, 'tenant_id', None) != tenant.id:
                raise serializers.ValidationError({field_name: 'Entidade não pertence ao tenant atual.'})

        inst = attrs.get('installment')
        recv = attrs.get('receivable')
        if inst is not None and recv is not None and inst.receivable_id != recv.id:
            raise serializers.ValidationError({'installment': 'Parcela não pertence à cobrança selecionada.'})

        return attrs


def _split_amount(total: Decimal, n: int) -> list[Decimal]:
    if n <= 1:
        return [total]
    base = (total / Decimal(n)).quantize(Decimal('0.01'))
    parts = [base] * n
    diff = total - sum(parts)
    parts[-1] = (parts[-1] + diff).quantize(Decimal('0.01'))
    return parts


class AccountsReceivableViewSet(TenantAuditedModelViewSet):
    queryset = AccountsReceivable.objects.select_related('client', 'process').prefetch_related('installments').all().order_by('-due_date')
    serializer_class = AccountsReceivableSerializer
    permission_classes = [IsTenantMember, IsFinance]

    audit_enabled = True
    audit_entity_type = 'AccountsReceivable'

    filterset_fields = {
        'status': ['exact'],
        'client': ['exact'],
        'process': ['exact'],
        'category': ['exact'],
        'due_date': ['gte', 'lte'],
    }
    search_fields = ['description', 'client__name', 'client__doc', 'process__cnj', 'process__subject']
    ordering_fields = ['due_date', 'amount', 'status', 'created_at', 'updated_at']
    ordering = ['-due_date']

    def perform_create(self, serializer):
        tenant = getattr(self.request, 'tenant', None)
        count = serializer.validated_data.pop('installments_count', None)
        interval = serializer.validated_data.pop('installment_interval_days', None)

        obj = serializer.save(tenant=tenant, created_by=self.request.user)

        if count and count > 1:
            amounts = _split_amount(obj.amount, count)
            first_due = obj.due_date
            interval = interval or 30
            for i in range(count):
                ReceivableInstallment.objects.create(
                    tenant=tenant,
                    receivable=obj,
                    number=i + 1,
                    due_date=first_due + timedelta(days=interval * i),
                    amount=amounts[i],
                    status=FinancialStatus.ABERTA,
                )
            obj.total_installments = count
            obj.installments_count = count
            obj.installment_interval_days = interval
            obj.save(update_fields=['total_installments', 'installments_count', 'installment_interval_days'])

        self._emit_audit(
            event_type='accountsreceivable_created',
            instance=obj,
            after=self._snapshot(obj),
            summary='Conta a receber criada',
        )

    @action(detail=True, methods=['get'], url_path='installments')
    def installments(self, request, pk=None):
        recv = self.get_object()
        qs = recv.installments.filter(deleted_at__isnull=True).order_by('number')
        page = self.paginate_queryset(qs)
        ser = ReceivableInstallmentSerializer(page or qs, many=True)
        return self.get_paginated_response(ser.data) if page is not None else Response(ser.data)


class ReceivableInstallmentViewSet(TenantAuditedModelViewSet):
    queryset = ReceivableInstallment.objects.select_related('receivable', 'receivable__client', 'receivable__process').all().order_by('due_date')
    serializer_class = ReceivableInstallmentSerializer
    permission_classes = [IsTenantMember, IsFinance]

    audit_enabled = True
    audit_entity_type = 'ReceivableInstallment'

    filterset_fields = {
        'status': ['exact'],
        'receivable': ['exact'],
        'due_date': ['gte', 'lte'],
    }
    search_fields = ['receivable__description', 'receivable__client__name', 'receivable__process__cnj']
    ordering_fields = ['due_date', 'amount', 'status', 'created_at', 'updated_at']
    ordering = ['due_date']


class AccountsPayableViewSet(TenantAuditedModelViewSet):
    queryset = AccountsPayable.objects.select_related('process').all().order_by('-due_date')
    serializer_class = AccountsPayableSerializer
    permission_classes = [IsTenantMember, IsFinance]

    audit_enabled = True
    audit_entity_type = 'AccountsPayable'

    filterset_fields = {
        'status': ['exact'],
        'process': ['exact'],
        'employee': ['exact'],
        'category': ['exact'],
        'due_date': ['gte', 'lte'],
    }
    search_fields = ['description', 'supplier', 'employee__full_name', 'process__cnj', 'process__subject']
    ordering_fields = ['due_date', 'amount', 'status', 'created_at', 'updated_at']
    ordering = ['-due_date']


class InvoiceViewSet(TenantAuditedModelViewSet):
    queryset = Invoice.objects.select_related('client', 'process').all().order_by('-due_date')
    serializer_class = InvoiceSerializer
    permission_classes = [IsTenantMember, IsFinance]

    audit_enabled = True
    audit_entity_type = 'Invoice'

    filterset_fields = {
        'status': ['exact'],
        'client': ['exact'],
        'process': ['exact'],
        'type': ['exact'],
        'due_date': ['gte', 'lte'],
        'issue_date': ['gte', 'lte'],
    }
    search_fields = ['client__name', 'client__doc', 'process__cnj', 'process__subject']
    ordering_fields = ['due_date', 'issue_date', 'amount', 'status', 'created_at', 'updated_at']
    ordering = ['-due_date']


class PaymentViewSet(TenantAuditedModelViewSet):
    queryset = Payment.objects.select_related('invoice', 'receivable', 'installment', 'client', 'process').all().order_by('-payment_date')
    serializer_class = PaymentSerializer
    permission_classes = [IsTenantMember, IsFinance]

    audit_enabled = True
    audit_entity_type = 'Payment'

    filterset_fields = {
        'method': ['exact'],
        'client': ['exact'],
        'process': ['exact'],
        'invoice': ['exact'],
        'receivable': ['exact'],
        'installment': ['exact'],
        'payment_date': ['gte', 'lte'],
    }
    search_fields = ['notes', 'client__name', 'process__cnj']
    ordering_fields = ['payment_date', 'amount', 'created_at']
    ordering = ['-payment_date']

    def perform_create(self, serializer):
        tenant = getattr(self.request, 'tenant', None)
        obj = serializer.save(tenant=tenant, created_by=self.request.user)

        inst = getattr(obj, 'installment', None)
        if inst and inst.status != FinancialStatus.PAGA:
            inst.status = FinancialStatus.PAGA
            inst.paid_date = obj.payment_date
            inst.paid_amount = obj.amount
            inst.save(update_fields=['status', 'paid_date', 'paid_amount'])

            recv = inst.receivable
            if recv.installments.filter(deleted_at__isnull=True).exclude(status=FinancialStatus.PAGA).count() == 0:
                recv.status = FinancialStatus.PAGA
                recv.paid_date = obj.payment_date
                recv.save(update_fields=['status', 'paid_date'])

        elif obj.receivable and obj.receivable.status != FinancialStatus.PAGA:
            recv = obj.receivable
            if obj.amount >= recv.amount:
                recv.status = FinancialStatus.PAGA
                recv.paid_date = obj.payment_date
                recv.save(update_fields=['status', 'paid_date'])

        self._emit_audit(
            event_type='payment_created',
            instance=obj,
            after=self._snapshot(obj),
            summary='Pagamento registrado',
        )


class FinanceReportView(APIView):
    permission_classes = [IsTenantMember, IsFinance]

    def get(self, request):
        tenant = getattr(request, 'tenant', None)
        if tenant is None:
            return Response({'error': {'code': 'TENANT_REQUIRED', 'message': 'Tenant obrigatório', 'details': None, 'request_id': getattr(request, 'request_id', None)}}, status=400)

        kind = (request.query_params.get('kind') or 'receivable').lower()
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')

        def parse(d):
            try:
                return date.fromisoformat(d) if d else None
            except Exception:
                return None

        df = parse(date_from)
        dt = parse(date_to)

        if kind == 'payable':
            qs = AccountsPayable.objects.filter(tenant=tenant, deleted_at__isnull=True)
            if df:
                qs = qs.filter(due_date__gte=df)
            if dt:
                qs = qs.filter(due_date__lte=dt)
            rows = [
                {
                    'id': str(x.id),
                    'description': x.description,
                    'category': x.category,
                    'supplier': x.supplier or '',
                    'amount': str(x.amount),
                    'due_date': x.due_date.isoformat(),
                    'status': x.status,
                    'process': getattr(x.process, 'cnj', '') if x.process_id else '',
                }
                for x in qs.order_by('-due_date')[:50000]
            ]
        elif kind == 'payments':
            qs = Payment.objects.filter(tenant=tenant, deleted_at__isnull=True)
            if df:
                qs = qs.filter(payment_date__gte=df)
            if dt:
                qs = qs.filter(payment_date__lte=dt)
            rows = [
                {
                    'id': str(x.id),
                    'amount': str(x.amount),
                    'payment_date': x.payment_date.isoformat(),
                    'method': x.method,
                    'client': getattr(x.client, 'name', '') if x.client_id else '',
                    'process': getattr(x.process, 'cnj', '') if x.process_id else '',
                    'receivable': str(x.receivable_id) if x.receivable_id else '',
                    'installment': str(getattr(x, 'installment_id', '') or ''),
                }
                for x in qs.order_by('-payment_date')[:50000]
            ]
        else:
            qs = AccountsReceivable.objects.filter(tenant=tenant, deleted_at__isnull=True)
            if df:
                qs = qs.filter(due_date__gte=df)
            if dt:
                qs = qs.filter(due_date__lte=dt)
            rows = [
                {
                    'id': str(x.id),
                    'description': x.description,
                    'category': x.category,
                    'amount': str(x.amount),
                    'due_date': x.due_date.isoformat(),
                    'status': x.status,
                    'client': getattr(x.client, 'name', '') if x.client_id else '',
                    'process': getattr(x.process, 'cnj', '') if x.process_id else '',
                    'installments': str(x.total_installments or ''),
                }
                for x in qs.order_by('-due_date')[:50000]
            ]

        filename = f"finance_{kind}_{timezone.now().date().isoformat()}.csv"
        out = io.StringIO()
        if rows:
            writer = csv.DictWriter(out, fieldnames=list(rows[0].keys()))
            writer.writeheader()
            writer.writerows(rows)
        resp = HttpResponse(out.getvalue(), content_type='text/csv; charset=utf-8')
        resp['Content-Disposition'] = f'attachment; filename="{filename}"'
        return resp
