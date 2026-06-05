from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.finance.models import AccountsReceivable, ReceivableInstallment, FinancialStatus


class Command(BaseCommand):
    help = 'Atualiza status de contas a receber/parcelas (ABERTA -> VENCIDA) com base na data de vencimento.'

    def add_arguments(self, parser):
        parser.add_argument('--tenant', dest='tenant_id', default=None, help='Filtrar por tenant UUID')

    @transaction.atomic
    def handle(self, *args, **opts):
        today = timezone.localdate()
        tenant_id = opts.get('tenant_id')

        inst_qs = ReceivableInstallment.objects.filter(deleted_at__isnull=True, status=FinancialStatus.ABERTA, due_date__lt=today)
        if tenant_id:
            inst_qs = inst_qs.filter(tenant_id=tenant_id)
        inst_updated = inst_qs.update(status=FinancialStatus.VENCIDA)

        recv_qs = AccountsReceivable.objects.filter(deleted_at__isnull=True)
        if tenant_id:
            recv_qs = recv_qs.filter(tenant_id=tenant_id)

        updated_recv = 0
        for recv in recv_qs.prefetch_related('installments'):
            if recv.status in (FinancialStatus.PAGA, FinancialStatus.CANCELADA):
                continue
            insts = list(recv.installments.filter(deleted_at__isnull=True))
            if insts:
                if any(i.status == FinancialStatus.VENCIDA for i in insts) and recv.status != FinancialStatus.VENCIDA:
                    recv.status = FinancialStatus.VENCIDA
                    recv.save(update_fields=['status'])
                    updated_recv += 1
            else:
                if recv.due_date < today and recv.status == FinancialStatus.ABERTA:
                    recv.status = FinancialStatus.VENCIDA
                    recv.save(update_fields=['status'])
                    updated_recv += 1

        self.stdout.write(self.style.SUCCESS(f'Parcelas marcadas como VENCIDA: {inst_updated}'))
        self.stdout.write(self.style.SUCCESS(f'Contas a receber marcadas como VENCIDA: {updated_recv}'))
