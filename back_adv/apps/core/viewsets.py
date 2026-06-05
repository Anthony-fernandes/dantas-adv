from __future__ import annotations

from typing import Any, Dict

from django.forms.models import model_to_dict
from rest_framework import exceptions
from rest_framework import viewsets

from apps.core.services.audit import audit_event


class TenantScopedModelViewSet(viewsets.ModelViewSet):
    """Base ViewSet enforcing tenant scoping.

    Requires TenantContextMiddleware to set request.tenant.
    """

    tenant_field = 'tenant'

    def get_queryset(self):
        qs = super().get_queryset()
        tenant = getattr(self.request, 'tenant', None)
        if tenant is None and not (getattr(self.request, 'user', None) and self.request.user.is_superuser):
            return qs.none()
        if tenant is not None:
            qs = qs.filter(**{self.tenant_field: tenant})
        model = getattr(qs, 'model', None)
        if model is not None and any(getattr(f, 'name', None) == 'deleted_at' for f in model._meta.fields):
            qs = qs.filter(deleted_at__isnull=True)
        return qs

    def perform_create(self, serializer):
        tenant = getattr(self.request, 'tenant', None)
        if tenant is None:
            raise exceptions.ValidationError({"tenant": "Tenant context is required for create operations."})
        serializer.save(**{self.tenant_field: tenant})


class TenantAuditedModelViewSet(TenantScopedModelViewSet):
    """Tenant-scoped ViewSet with professional audit logging.

    Opt-in by setting `audit_enabled = True`.
    The audit payload includes before/after snapshots and a diff of changed keys.
    """

    audit_enabled: bool = False
    audit_entity_type: str | None = None

    # If the underlying model has these fields, they will be set automatically.
    created_by_field: str = 'created_by'
    updated_by_field: str = 'updated_by'

    def _entity_type(self) -> str:
        if self.audit_entity_type:
            return self.audit_entity_type
        try:
            return self.get_queryset().model.__name__
        except Exception:
            return self.__class__.__name__.replace('ViewSet', '')

    def _snapshot(self, instance) -> Dict[str, Any]:
        """Best-effort serialization of a model instance for auditing."""
        data = model_to_dict(instance)
        data['id'] = str(getattr(instance, 'id', ''))
        for k, v in list(data.items()):
            if hasattr(v, 'isoformat'):
                data[k] = v.isoformat()
            elif hasattr(v, 'hex') and len(str(v)) >= 32:
                data[k] = str(v)
            elif hasattr(v, 'quantize'):
                data[k] = str(v)
        return data

    def _diff_keys(self, before: Dict[str, Any], after: Dict[str, Any]) -> list[str]:
        keys = sorted(set(before.keys()) | set(after.keys()))
        return [k for k in keys if before.get(k) != after.get(k)]

    def _emit_audit(self, *, event_type: str, instance=None, before=None, after=None, summary: str = '') -> None:
        if not self.audit_enabled:
            return
        tenant = getattr(self.request, 'tenant', None)
        if tenant is None:
            return

        entity_type = self._entity_type()
        entity_id = getattr(instance, 'id', None) if instance is not None else None

        payload: Dict[str, Any] = {}
        if before is not None:
            payload['before'] = before
        if after is not None:
            payload['after'] = after
        if before is not None and after is not None:
            payload['diff_keys'] = self._diff_keys(before, after)

        actor = self.request.user if getattr(self.request, 'user', None) and self.request.user.is_authenticated else None

        audit_event(
            tenant=tenant,
            actor=actor,
            event_type=event_type,
            entity_type=entity_type,
            entity_id=entity_id,
            summary=summary or event_type,
            payload=payload,
        )

    def perform_create(self, serializer):
        tenant = getattr(self.request, 'tenant', None)
        extra = {self.tenant_field: tenant}
        if hasattr(serializer.Meta.model, self.created_by_field):
            extra[self.created_by_field] = self.request.user
        obj = serializer.save(**extra)

        self._emit_audit(
            event_type=f"{self._entity_type().lower()}_created",
            instance=obj,
            after=self._snapshot(obj),
            summary=f"{self._entity_type()} criado",
        )

    def perform_update(self, serializer):
        instance = self.get_object()
        before = self._snapshot(instance)

        extra = {}
        if hasattr(serializer.Meta.model, self.updated_by_field):
            extra[self.updated_by_field] = self.request.user
        obj = serializer.save(**extra)

        after = self._snapshot(obj)
        self._emit_audit(
            event_type=f"{self._entity_type().lower()}_updated",
            instance=obj,
            before=before,
            after=after,
            summary=f"{self._entity_type()} atualizado",
        )

    def perform_destroy(self, instance):
        before = self._snapshot(instance)
        entity_type = self._entity_type()
        entity_id = getattr(instance, 'id', None)

        # Soft-delete if supported by model
        if hasattr(instance, 'deleted_at'):
            try:
                from django.utils import timezone
                instance.deleted_at = instance.deleted_at or timezone.now()
                if hasattr(instance, 'deleted_by'):
                    instance.deleted_by = self.request.user
                instance.save(update_fields=[f for f in ['deleted_at','deleted_by'] if hasattr(instance, f)])
            except Exception:
                super().perform_destroy(instance)
        else:
            super().perform_destroy(instance)

        # emit after delete using captured id
        self._emit_audit(
            event_type=f"{entity_type.lower()}_deleted",
            instance=type('X', (), {'id': entity_id})(),
            before=before,
            summary=f"{entity_type} removido",
        )
