from __future__ import annotations

from datetime import timedelta
from typing import Iterable

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.core.models import Tenant
from apps.accounts.models import UserRole, User
from apps.notifications.services import NotificationSpec, notify_users, _safe_send_email
from apps.notifications.email_templates import deadline_alert_email
from apps.processes.models import Deadline, DeadlineStatus, DeadlineAlert
from apps.core.services.audit import audit_event


DEFAULT_WINDOWS_HOURS = [168, 72, 24, 0]  # D-7, D-3, D-1, D-0


def _tenant_legal_user_ids(tenant_id) -> list[str]:
    legal_roles = ['OWNER', 'ADMIN', 'LAWYER', 'ASSISTANT']
    return list(
        UserRole.objects.filter(tenant_id=tenant_id, role__in=legal_roles)
        .values_list('user_id', flat=True)
    )


def _get_windows(tenant: Tenant) -> list[int]:
    settings = tenant.settings or {}
    windows = settings.get('deadline_alert_windows_hours')
    if isinstance(windows, list) and all(isinstance(x, int) for x in windows):
        return windows
    return DEFAULT_WINDOWS_HOURS


def _get_default_channels(tenant: Tenant) -> list[str]:
    settings = tenant.settings or {}
    channels = settings.get('default_alert_channels')
    if isinstance(channels, list) and all(isinstance(x, str) for x in channels):
        return channels
    return ['inapp']  # safest default


class Command(BaseCommand):
    help = 'Send scheduled deadline alerts (D-7, D-3, D-1, D-0) for pending deadlines.'

    def add_arguments(self, parser):
        parser.add_argument('--tenant', type=str, default=None, help='Optional tenant UUID to process only one tenant')
        parser.add_argument('--tolerance-minutes', type=int, default=30, help='Time window tolerance in minutes')

    @transaction.atomic
    def handle(self, *args, **options):
        tenant_id = options.get('tenant')
        tol_minutes = int(options.get('tolerance_minutes') or 30)

        tenants = Tenant.objects.all()
        if tenant_id:
            tenants = tenants.filter(id=tenant_id)

        now = timezone.now()
        tol = timedelta(minutes=tol_minutes)

        sent_total = 0

        for tenant in tenants:
            windows = _get_windows(tenant)
            default_channels = _get_default_channels(tenant)

            for window_hours in windows:
                target = now + timedelta(hours=window_hours)
                start = target - tol
                end = target + tol

                qs = Deadline.objects.select_related('process', 'responsible').filter(
                    tenant=tenant,
                    status=DeadlineStatus.PENDENTE,
                    due_date__gte=start,
                    due_date__lte=end,
                )

                for deadline in qs:
                    if DeadlineAlert.objects.filter(deadline=deadline, window_hours=window_hours).exists():
                        continue

                    channels = (deadline.alert_channels or []) or default_channels
                    send_email = 'email' in channels

                    # Recipients: responsible, else legal team
                    if deadline.responsible_id:
                        users = [deadline.responsible]
                    else:
                        user_ids = _tenant_legal_user_ids(tenant.id)
                        users = list(User.objects.filter(id__in=user_ids))

                    due_str = timezone.localtime(deadline.due_date).strftime('%d/%m/%Y %H:%M')
                    days_until = max(0, round(window_hours / 24))
                    process_cnj = getattr(deadline.process, 'cnj', '') or ''
                    title = f'Alerta de prazo — {deadline.description[:60]}'
                    plain_msg = f'Vence em {window_hours}h: {deadline.description}\nVencimento: {due_str}'
                    spec = NotificationSpec(
                        type='deadline_alert',
                        title=title,
                        message=plain_msg,
                        payload={
                            'deadline_id': str(deadline.id),
                            'process_id': str(deadline.process_id),
                            'window_hours': window_hours,
                        },
                    )
                    if send_email:
                        users_with_profile = list(User.objects.filter(id__in=[u.id for u in users]).select_related('profile'))
                        for u in users_with_profile:
                            profile = getattr(u, 'profile', None)
                            name = getattr(profile, 'full_name', None) or u.email
                            _subj, html = deadline_alert_email(
                                user_name=name,
                                deadline_description=deadline.description or '',
                                due_date_str=due_str,
                                process_cnj=process_cnj,
                                days_until=days_until,
                                office_name=tenant.name,
                            )
                            _safe_send_email(to_email=u.email, subject=_subj, message=plain_msg, html_message=html)
                        notify_users(tenant=tenant, users=users, spec=spec, send_email=False)
                    else:
                        notify_users(tenant=tenant, users=users, spec=spec, send_email=False)

                    DeadlineAlert.objects.create(tenant=tenant, deadline=deadline, window_hours=window_hours)
                    audit_event(
                        tenant=tenant,
                        actor=None,
                        event_type='deadline_alert_sent',
                        entity_type='Deadline',
                        entity_id=deadline.id,
                        summary=f'Alerta enviado (window={window_hours}h)',
                        payload={'window_hours': window_hours, 'deadline_id': str(deadline.id)},
                    )
                    sent_total += 1

        self.stdout.write(self.style.SUCCESS(f'Sent {sent_total} deadline alerts.'))
