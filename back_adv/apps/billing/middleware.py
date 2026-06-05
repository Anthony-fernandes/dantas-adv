from __future__ import annotations

from django.urls import resolve
from rest_framework.exceptions import PermissionDenied

from .services import ensure_subscription_for_tenant


PUBLIC_PATH_PREFIXES = (
    '/admin',
    '/api/auth/',
    '/api/tenants',
)


def enforce_billing_or_raise(request) -> None:
    """Block tenant access when subscription is not allowed.

    We do not block public endpoints (login/onboarding/invite accept).
    """

    path = request.path or ''
    if path.startswith(PUBLIC_PATH_PREFIXES):
        return

    tenant = getattr(request, 'tenant', None)
    if not tenant:
        return

    sub = ensure_subscription_for_tenant(tenant)
    if not sub.is_access_allowed():
        raise PermissionDenied(detail='Billing blocked', code='BILLING_BLOCKED')
