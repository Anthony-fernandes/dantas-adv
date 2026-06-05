from rest_framework import exceptions, permissions


def get_request_tenant(request):
    # Prefer the mandatory tenant context (set by TenantContextMiddleware).
    tenant = getattr(request, 'tenant', None)
    if tenant is not None:
        return tenant
    # Backward compatibility (legacy): fall back to profile.tenant.
    return getattr(getattr(request.user, 'profile', None), 'tenant', None)


class HasTenant(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and get_request_tenant(request) is not None


class TenantScopedQuerysetMixin:
    tenant_field = 'tenant'

    def get_queryset(self):
        tenant = get_request_tenant(self.request)
        qs = super().get_queryset()
        if not tenant and not (getattr(self.request, 'user', None) and self.request.user.is_superuser):
            return qs.none()
        if tenant:
            return qs.filter(**{self.tenant_field: tenant})
        return qs

    def perform_create(self, serializer):
        tenant = get_request_tenant(self.request)
        if tenant is None:
            raise exceptions.ValidationError({'tenant': 'Tenant context is required for create operations.'})
        serializer.save(**{self.tenant_field: tenant})
