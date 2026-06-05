from __future__ import annotations

from typing import Any, Optional
from django.db import transaction

from apps.core.models import AuditEvent, Tenant


@transaction.atomic
def audit_event(
    *,
    tenant: Tenant,
    actor,
    event_type: str,
    entity_type: str,
    entity_id=None,
    summary: str = '',
    payload: Optional[dict[str, Any]] = None,
) -> AuditEvent:
    return AuditEvent.objects.create(
        tenant=tenant,
        actor=actor,
        event_type=event_type,
        entity_type=entity_type,
        entity_id=entity_id,
        summary=summary or '',
        payload=payload or {},
    )
