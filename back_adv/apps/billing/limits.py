from __future__ import annotations

from rest_framework import serializers

from apps.accounts.models import UserRole
from apps.processes.models import Process

from .services import ensure_subscription_for_tenant


def _get_limit(subscription, key: str):
    limits = (subscription.plan.limits or {}) if subscription and subscription.plan else {}
    val = limits.get(key)
    return None if val in (None, '', 0) else int(val)


def assert_can_create_user(tenant) -> None:
    sub = ensure_subscription_for_tenant(tenant)
    limit = _get_limit(sub, 'users')
    if limit is None:
        return
    count = UserRole.objects.filter(tenant=tenant).values('user_id').distinct().count()
    if count >= limit:
        raise serializers.ValidationError({'billing': f'Limite de usuários atingido ({count}/{limit}).'}, code='LIMIT_EXCEEDED')


def assert_can_create_process(tenant) -> None:
    sub = ensure_subscription_for_tenant(tenant)
    limit = _get_limit(sub, 'processes')
    if limit is None:
        return
    count = Process.objects.filter(tenant=tenant).count()
    if count >= limit:
        raise serializers.ValidationError({'billing': f'Limite de processos atingido ({count}/{limit}).'}, code='LIMIT_EXCEEDED')
