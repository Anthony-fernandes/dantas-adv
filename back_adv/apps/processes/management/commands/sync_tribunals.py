"""Sincronização agendada de andamentos com tribunais.

Percorre todos os vínculos TribunalSync (opcionalmente de um tenant) e
reexecuta a consulta ao provedor, importando movimentos novos — mesmo
fluxo da ação manual "Sincronizar" da central de integrações.

Agende via cron, por exemplo a cada 6 horas:
    0 */6 * * *  python manage.py sync_tribunals
"""
from __future__ import annotations

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.core.services.audit import audit_event
from apps.processes.models import Movement, TribunalSync


class Command(BaseCommand):
    help = 'Sincroniza andamentos de todos os vínculos de tribunal (PJe/e-SAJ).'

    def add_arguments(self, parser):
        parser.add_argument('--tenant', type=str, default=None, help='UUID de um tenant específico')
        parser.add_argument('--only-errors', action='store_true', help='Reexecuta apenas vínculos com erro')

    def handle(self, *args, **options):
        queryset = TribunalSync.objects.select_related('tenant', 'process').all()
        if options['tenant']:
            queryset = queryset.filter(tenant_id=options['tenant'])
        if options['only_errors']:
            queryset = queryset.filter(sync_status='error')

        total = queryset.count()
        ok = 0
        failed = 0

        for sync in queryset.iterator():
            try:
                imported = self._sync_one(sync)
                ok += 1
                self.stdout.write(self.style.SUCCESS(
                    f'[{sync.tenant.name}] {sync.external_process_number} ({sync.provider}): {imported} movimento(s) importado(s)'
                ))
            except Exception as error:
                failed += 1
                sync.sync_status = 'error'
                sync.error_message = str(error)[:1000]
                sync.save(update_fields=['sync_status', 'error_message'])
                self.stderr.write(self.style.ERROR(
                    f'[{sync.tenant.name}] {sync.external_process_number}: {error}'
                ))

        self.stdout.write(self.style.SUCCESS(f'Concluído: {ok} ok, {failed} com erro, {total} no total.'))

    def _sync_one(self, sync: TribunalSync) -> int:
        tenant_settings = sync.tenant.settings or {}

        if sync.provider == TribunalSync.Provider.ESAJ:
            from apps.processes.integrations.esaj import eSAJService
            result = eSAJService().consultar_processo(sync.external_process_number)
        elif sync.provider == TribunalSync.Provider.PJE:
            from apps.processes.integrations.pje import PJeService
            tribunal_url = tenant_settings.get('pje_tribunal_url', '')
            if not tribunal_url:
                raise ValueError('pje_tribunal_url não configurado nas configurações do tenant.')
            result = PJeService().consultar_processo(sync.external_process_number, tribunal_url)
        else:
            raise ValueError(f'Provider "{sync.provider}" não suporta sincronização automática.')

        movimentos = result.get('movimentos', [])
        imported = 0
        for movimento in movimentos:
            date = movimento.get('data') or timezone.now().date().isoformat()
            description = (movimento.get('descricao') or '').strip()
            if not description:
                continue
            _, created = Movement.objects.get_or_create(
                tenant=sync.tenant,
                process=sync.process,
                date=date,
                description=description,
                defaults={'type': 'publicacao'},
            )
            if created:
                imported += 1

        sync.sync_status = 'ok'
        sync.error_message = None
        sync.last_synced_at = timezone.now()
        sync.raw_response = result if isinstance(result, dict) else {}
        sync.save(update_fields=['sync_status', 'error_message', 'last_synced_at', 'raw_response'])

        audit_event(
            tenant=sync.tenant,
            actor=None,
            event_type='tribunal.sync_scheduled',
            entity_type='TribunalSync',
            entity_id=sync.id,
            summary=f'Sync agendada {sync.provider}: {imported} movimento(s) importado(s)',
            payload={'imported': imported, 'external_number': sync.external_process_number},
        )
        return imported
