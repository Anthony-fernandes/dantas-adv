from __future__ import annotations

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone

from apps.accounts.models import UserRole
from apps.notifications.services import NotificationSpec, notify_users
from apps.notifications.email_templates import deadline_alert_email, hearing_alert_email
from apps.processes.models import Deadline, DeadlineStatus, Hearing


def _tenant_legal_users(tenant_id):
    legal_roles = ['OWNER', 'ADMIN', 'LAWYER', 'ASSISTANT']
    return (
        UserRole.objects
        .filter(tenant_id=tenant_id, role__in=legal_roles)
        .select_related('user')
        .values_list('user', flat=True)
    )


def _user_display_name(user) -> str:
    profile = getattr(user, 'profile', None)
    return getattr(profile, 'full_name', None) or user.email


@receiver(pre_save, sender=Deadline)
def _deadline_track_previous(sender, instance: Deadline, **kwargs):
    if not instance.pk:
        instance._previous_status = None
        instance._previous_due_date = None
        return
    try:
        prev = Deadline.objects.only('status', 'due_date').get(pk=instance.pk)
        instance._previous_status = prev.status
        instance._previous_due_date = prev.due_date
    except Deadline.DoesNotExist:
        instance._previous_status = None
        instance._previous_due_date = None


@receiver(post_save, sender=Deadline)
def _deadline_notify(sender, instance: Deadline, created: bool, **kwargs):
    tenant = instance.tenant
    send_email = 'email' in (instance.alert_channels or [])

    from apps.accounts.models import User
    if instance.responsible_id:
        users_qs = list(User.objects.filter(id=instance.responsible_id).select_related('profile'))
    else:
        user_ids = list(_tenant_legal_users(tenant.id))
        users_qs = list(User.objects.filter(id__in=user_ids).select_related('profile'))

    due_str = timezone.localtime(instance.due_date).strftime('%d/%m/%Y %H:%M') if instance.due_date else '—'
    process_cnj = instance.process.cnj if instance.process_id else ''

    if created:
        spec = NotificationSpec(
            type='deadline_created',
            title='Novo prazo cadastrado',
            message=f'Prazo: {instance.description}\nVencimento: {due_str}',
            payload={'deadline_id': str(instance.id), 'process_id': str(instance.process_id)},
        )
        notify_users(tenant=tenant, users=users_qs, spec=spec, send_email=send_email)
        return

    previous_status = getattr(instance, '_previous_status', None)
    previous_due_date = getattr(instance, '_previous_due_date', None)

    if previous_status != instance.status:
        if instance.status == DeadlineStatus.CONCLUIDO:
            spec = NotificationSpec(
                type='deadline_completed',
                title='Prazo concluído',
                message=f'Prazo concluído: {instance.description}',
                payload={'deadline_id': str(instance.id), 'process_id': str(instance.process_id)},
            )
            notify_users(tenant=tenant, users=users_qs, spec=spec, send_email=False)

        elif instance.status == DeadlineStatus.ATRASADO:
            spec = NotificationSpec(
                type='deadline_overdue',
                title=f'⚠️ Prazo atrasado: {instance.description[:60]}',
                message=f'Prazo atrasado: {instance.description}\nVencimento: {due_str}',
                payload={'deadline_id': str(instance.id), 'process_id': str(instance.process_id)},
            )
            if send_email:
                for u in users_qs:
                    _subj, html = deadline_alert_email(
                        user_name=_user_display_name(u),
                        deadline_description=instance.description or '',
                        due_date_str=due_str,
                        process_cnj=process_cnj or '',
                        days_until=0,
                        office_name=tenant.name,
                    )
                    from apps.notifications.services import _safe_send_email
                    _safe_send_email(to_email=u.email, subject=_subj, message=spec.message, html_message=html)
                notify_users(tenant=tenant, users=users_qs, spec=spec, send_email=False)
            else:
                notify_users(tenant=tenant, users=users_qs, spec=spec, send_email=False)

    if previous_due_date and previous_due_date != instance.due_date:
        spec = NotificationSpec(
            type='deadline_rescheduled',
            title='Prazo atualizado',
            message=f'Prazo atualizado: {instance.description}\nNovo vencimento: {due_str}',
            payload={'deadline_id': str(instance.id), 'process_id': str(instance.process_id)},
        )
        notify_users(tenant=tenant, users=users_qs, spec=spec, send_email=send_email)


@receiver(post_save, sender=Hearing)
def _hearing_notify(sender, instance: Hearing, created: bool, **kwargs):
    if not created:
        return

    tenant = instance.tenant
    from apps.accounts.models import User
    if instance.responsible_id:
        users = list(User.objects.filter(id=instance.responsible_id).select_related('profile'))
    else:
        user_ids = list(_tenant_legal_users(tenant.id))
        users = list(User.objects.filter(id__in=user_ids).select_related('profile'))

    dt_str = timezone.localtime(instance.hearing_date).strftime('%d/%m/%Y às %H:%M') if instance.hearing_date else '—'
    process_cnj = instance.process.cnj if instance.process_id else ''

    spec = NotificationSpec(
        type='hearing_scheduled',
        title=f'Audiência agendada: {instance.type or ""}',
        message=f'Audiência ({instance.type or ""}): {dt_str}',
        payload={'hearing_id': str(instance.id), 'process_id': str(instance.process_id)},
    )

    for u in users:
        from apps.notifications.services import _safe_send_email, create_notification
        create_notification(tenant=tenant, user=u, spec=spec)
        _subj, html = hearing_alert_email(
            user_name=_user_display_name(u),
            hearing_type=instance.type or 'Audiência',
            hearing_date_str=dt_str,
            process_cnj=process_cnj or '',
            office_name=tenant.name,
        )
        _safe_send_email(to_email=u.email, subject=_subj, message=spec.message, html_message=html)
