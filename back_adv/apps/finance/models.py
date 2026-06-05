import uuid
from django.db import models

from apps.core.models import Tenant
from apps.clients.models import Client
from apps.processes.models import Process
from apps.accounts.models import User
from apps.accounts.models import Employee


class FinancialStatus(models.TextChoices):
    ABERTA = 'aberta', 'Aberta'
    PAGA = 'paga', 'Paga'
    VENCIDA = 'vencida', 'Vencida'
    CANCELADA = 'cancelada', 'Cancelada'


class InvoiceStatus(models.TextChoices):
    RASCUNHO = 'rascunho', 'Rascunho'
    EMITIDA = 'emitida', 'Emitida'
    PAGA = 'paga', 'Paga'
    VENCIDA = 'vencida', 'Vencida'
    CANCELADA = 'cancelada', 'Cancelada'


class PaymentMethod(models.TextChoices):
    DINHEIRO = 'dinheiro', 'Dinheiro'
    TRANSFERENCIA = 'transferencia', 'Transferência'
    PIX = 'pix', 'PIX'
    CARTAO = 'cartao', 'Cartão'
    BOLETO = 'boleto', 'Boleto'
    CHEQUE = 'cheque', 'Cheque'


class AccountsReceivable(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='accounts_receivable')
    client = models.ForeignKey(Client, on_delete=models.SET_NULL, blank=True, null=True, related_name='receivables')
    process = models.ForeignKey(Process, on_delete=models.SET_NULL, blank=True, null=True, related_name='receivables')
    description = models.TextField()
    category = models.CharField(max_length=120, default='honorarios')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    due_date = models.DateField()
    paid_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=12, choices=FinancialStatus.choices, default=FinancialStatus.ABERTA)
    installment_number = models.IntegerField(blank=True, null=True)
    total_installments = models.IntegerField(blank=True, null=True)
    installments_count = models.IntegerField(blank=True, null=True)
    installment_interval_days = models.IntegerField(blank=True, null=True)
    penalty_rate = models.DecimalField(max_digits=6, decimal_places=2, default=2.00)  # %
    interest_rate_daily = models.DecimalField(max_digits=6, decimal_places=4, default=0.0333)  # %/day
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='receivables_created')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='receivables_updated')
    deleted_at = models.DateTimeField(blank=True, null=True, db_index=True)
    deleted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='deleted_accountsreceivable')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class AccountsPayable(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='accounts_payable')
    description = models.TextField()
    category = models.CharField(max_length=120, default='custas')
    supplier = models.CharField(max_length=255, blank=True, null=True)
    employee = models.ForeignKey(Employee, on_delete=models.SET_NULL, blank=True, null=True, related_name='payables')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    due_date = models.DateField()
    paid_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=12, choices=FinancialStatus.choices, default=FinancialStatus.ABERTA)
    process = models.ForeignKey(Process, on_delete=models.SET_NULL, blank=True, null=True, related_name='payables')
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='payables_created')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='payables_updated')
    deleted_at = models.DateTimeField(blank=True, null=True, db_index=True)
    deleted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='deleted_accountspayable')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Invoice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='invoices')
    client = models.ForeignKey(Client, on_delete=models.SET_NULL, blank=True, null=True, related_name='invoices')
    process = models.ForeignKey(Process, on_delete=models.SET_NULL, blank=True, null=True, related_name='invoices')
    type = models.CharField(max_length=50, default='NF')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    issue_date = models.DateField(blank=True, null=True)
    due_date = models.DateField()
    status = models.CharField(max_length=12, choices=InvoiceStatus.choices, default=InvoiceStatus.RASCUNHO)
    items = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices_created')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices_updated')
    deleted_at = models.DateTimeField(blank=True, null=True, db_index=True)
    deleted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='deleted_invoice')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Payment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='payments')
    receivable = models.ForeignKey(AccountsReceivable, on_delete=models.SET_NULL, blank=True, null=True, related_name='payments')
    installment = models.ForeignKey('ReceivableInstallment', on_delete=models.SET_NULL, blank=True, null=True, related_name='payments')
    invoice = models.ForeignKey(Invoice, on_delete=models.SET_NULL, blank=True, null=True, related_name='payments')
    client = models.ForeignKey(Client, on_delete=models.SET_NULL, blank=True, null=True, related_name='payments')
    process = models.ForeignKey(Process, on_delete=models.SET_NULL, blank=True, null=True, related_name='payments')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    payment_date = models.DateField()
    method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.TRANSFERENCIA)
    receipt_url = models.URLField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments_created')
    deleted_at = models.DateTimeField(blank=True, null=True, db_index=True)
    deleted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='deleted_payment')
    created_at = models.DateTimeField(auto_now_add=True)


class ReceivableInstallment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='receivable_installments')
    receivable = models.ForeignKey(AccountsReceivable, on_delete=models.CASCADE, related_name='installments')
    number = models.IntegerField()
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    status = models.CharField(max_length=12, choices=FinancialStatus.choices, default=FinancialStatus.ABERTA)
    paid_date = models.DateField(blank=True, null=True)
    paid_amount = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    deleted_at = models.DateTimeField(blank=True, null=True, db_index=True)
    deleted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='deleted_receivable_installment')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['tenant', 'receivable', 'due_date']),
            models.Index(fields=['tenant', 'status', 'due_date']),
        ]
        unique_together = [('receivable', 'number')]
