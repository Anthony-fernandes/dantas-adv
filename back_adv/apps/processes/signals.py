from __future__ import annotations

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone

from apps.accounts.models import UserRole
from apps.notifications.services import NotificationSpec, notify_users
from apps.processes.models import Deadline, DeadlineStatus, Hearing


def _tenant_legal_users(tenant_id):
    """Users that should receive legal notifications."""
    legal_roles = [
        'OWNER',
        'ADMIN',
        'LAWYER',
        'ASSISTANT',
    ]
    return (
        UserRole.objects
        .filter(tenant_id=tenant_id, role__in=legal_roles)
        .select_related('user')
        .values_list('user', flat=True)
    )


@receiver(pre_save, sender=Deadline)
def _deadline_track_previous(sender, instance: Deadline, **kwargs):
    if not instance.pk:
        instance._previous_status = None  # type: ignore[attr-defined]
        instance._previous_due_date = None  # type: ignore[attr-defined]
        return
    try:
        prev = Deadline.objects.only('status', 'due_date').get(pk=instance.pk)
        instance._previous_status = prev.status  # type: ignore[attr-defined]
        instance._previous_due_date = prev.due_date  # type: ignore[attr-defined]
    except Deadline.DoesNotExist:
        instance._previous_status = None  # type: ignore[attr-defined]
        instance._previous_due_date = None  # type: ignore[attr-defined]


@receiver(post_save, sender=Deadline)
def _deadline_notify(sender, instance: Deadline, created: bool, **kwargs):
    # Always notify the responsible when set; otherwise notify legal team.
    tenant = instance.tenant
    users_qs = None
    send_email = 'email' in (instance.alert_channels or [])

    if instance.responsible_id:
        users_qs = [instance.responsible]
    else:
        user_ids = list(_tenant_legal_users(tenant.id))
        from apps.accounts.models import User
        users_qs = list(User.objects.filter(id__in=user_ids))

    due_str = timezone.localtime(instance.due_date).strftime('%d/%m/%Y %H:%M')

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

    # status transition notifications
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
                title='Prazo atrasado',
                message=f'Prazo atrasado: {instance.description}\nVencimento: {due_str}',
                payload={'deadline_id': str(instance.id), 'process_id': str(instance.process_id)},
            )
            notify_users(tenant=tenant, users=users_qs, spec=spec, send_email=True)

    # due_date changed -> notify
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
    send_email = True
    users = []
    if instance.responsible_id:
        users = [instance.responsible]
    else:
        user_ids = list(_tenant_legal_users(tenant.id))
        from apps.accounts.models import User
        users = list(User.objects.filter(id__in=user_ids))

    dt_str = timezone.localtime(instance.hearing_date).strftime('%d/%m/%Y %H:%M')
    spec = NotificationSpec(
        type='hearing_scheduled',
        title='Audiência agendada',
        message=f'Audiência agendada ({instance.type or ""}): {dt_str}',
        payload={'hearing_id': str(instance.id), 'process_id': str(instance.process_id)},
    )
    notify_users(tenant=tenant, users=users, spec=spec, send_email=send_email)

