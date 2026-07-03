from __future__ import annotations

from typing import Any, Optional
from django.db import transaction

from apps.core.models import AuditEvent, Tenant


@transaction.atomic
def audit_event(
    *,
    tenant: Optional[Tenant],
    actor,
    event_type: str,
    entity_type: str,
    entity_id=None,
    summary: str = '',
    payload: Optional[dict[str, Any]] = None,
) -> AuditEvent:
    """Registra um evento de auditoria.

    tenant pode ser None para eventos de conta (login/logout), que ocorrem
    antes da seleção de tenant.
    """
    return AuditEvent.objects.create(
        tenant=tenant,
        actor=actor,
        event_type=event_type,
        entity_type=entity_type,
        entity_id=entity_id,
        summary=summary or '',
        payload=payload or {},
    )


def audit_auth_event(*, user, event_type: str, request=None, summary: str = '') -> Optional[AuditEvent]:
    """Evento de autenticação (login/logout/falha). Nunca propaga exceção."""
    try:
        payload = {}
        if request is not None:
            payload = {
                'ip': (request.META.get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR') or '').split(',')[0].strip(),
                'user_agent': (request.META.get('HTTP_USER_AGENT') or '')[:255],
            }
        return audit_event(
            tenant=None,
            actor=user if getattr(user, 'pk', None) else None,
            event_type=event_type,
            entity_type='Auth',
            entity_id=getattr(user, 'pk', None),
            summary=summary or event_type,
            payload=payload,
        )
    except Exception:
        return None
