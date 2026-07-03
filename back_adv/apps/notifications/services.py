from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Iterable

from django.conf import settings
from django.core.mail import send_mail, EmailMultiAlternatives
from django.utils import timezone

from apps.notifications.models import Notification
from apps.core.models import Tenant
from apps.accounts.models import User


@dataclass(frozen=True)
class NotificationSpec:
    type: str
    title: str
    message: str
    payload: dict[str, Any] | None = None


def create_notification(*, tenant: Tenant, user: User, spec: NotificationSpec) -> Notification:
    return Notification.objects.create(
        tenant=tenant,
        user=user,
        type=spec.type,
        title=spec.title,
        message=spec.message,
        payload=spec.payload or {},
        read=False,
        created_at=timezone.now(),
    )


def notify_users(
    *,
    tenant: Tenant,
    users: Iterable[User],
    spec: NotificationSpec,
    send_email: bool = False,
    html_message: str | None = None,
) -> list[Notification]:
    notifications: list[Notification] = []
    for u in users:
        notifications.append(create_notification(tenant=tenant, user=u, spec=spec))
        if send_email:
            _safe_send_email(
                to_email=u.email,
                subject=spec.title,
                message=spec.message,
                html_message=html_message,
            )
    return notifications


def _safe_send_email(
    *,
    to_email: str,
    subject: str,
    message: str,
    html_message: str | None = None,
    from_email: str | None = None,
) -> None:
    if not to_email:
        return
    try:
        sender = from_email or getattr(settings, "DEFAULT_FROM_EMAIL", None)
        if html_message:
            email = EmailMultiAlternatives(
                subject=subject,
                body=message,
                from_email=sender,
                to=[to_email],
            )
            email.attach_alternative(html_message, "text/html")
            email.send(fail_silently=True)
        else:
            send_mail(
                subject=subject,
                message=message,
                from_email=sender,
                recipient_list=[to_email],
                fail_silently=True,
            )
    except Exception:
        return


def notify_portal_client(*, tenant, process, notif_type: str, title: str, message: str, payload=None):
    """Notifica o usuário do portal vinculado ao cliente de um processo.

    No-op silencioso quando o processo não tem cliente ou o cliente não
    tem acesso ao portal — nunca interrompe o fluxo principal.
    """
    try:
        client = getattr(process, 'client', None)
        portal_user = getattr(client, 'portal_user', None) if client else None
        if not portal_user:
            return None
        return create_notification(
            tenant=tenant,
            user=portal_user,
            spec=NotificationSpec(type=notif_type, title=title, message=message, payload=payload or {}),
        )
    except Exception:
        return None
