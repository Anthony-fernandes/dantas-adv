from rest_framework import permissions

from apps.accounts.models import AppRole, UserAccessPermission, UserRole


class IsTenantMember(permissions.BasePermission):
    """Ensures request is authenticated and has tenant context."""

    message = 'Tenant context is required.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request, 'tenant', None) is not None
        )


class RolePermission(permissions.BasePermission):
    """Base RBAC permission bound to the current tenant."""

    required_roles: set[str] = set()
    message = 'You do not have permission to perform this action.'

    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated and request.user.is_superuser:
            return True
        tenant = getattr(request, 'tenant', None)
        if not (request.user and request.user.is_authenticated and tenant):
            return False
        return UserRole.objects.filter(
            user=request.user,
            tenant=tenant,
            role__in=self.required_roles,
        ).exists()


class IsOwnerOrAdmin(RolePermission):
    required_roles = {AppRole.OWNER, AppRole.ADMIN}


class IsFinance(RolePermission):
    required_roles = {AppRole.OWNER, AppRole.ADMIN, AppRole.FINANCE}


class IsLegal(RolePermission):
    required_roles = {AppRole.OWNER, AppRole.ADMIN, AppRole.LAWYER, AppRole.ASSISTANT}


class IsClient(RolePermission):
    """Portal (client) access inside a tenant."""

    required_roles = {AppRole.CLIENT}


def _has_role(request, tenant, roles: set[str]) -> bool:
    return UserRole.objects.filter(user=request.user, tenant=tenant, role__in=roles).exists()


def _has_any_permission_code(request, tenant, codes: set[str]) -> bool:
    return UserAccessPermission.objects.filter(user=request.user, tenant=tenant, code__in=codes).exists()


class PositionAccessPermission(permissions.BasePermission):
    """Access control for employee positions (cargos)."""

    message = 'VocÃª nÃ£o tem permissÃ£o para acessar cargos.'

    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated and request.user.is_superuser:
            return True
        tenant = getattr(request, 'tenant', None)
        if not (request.user and request.user.is_authenticated and tenant):
            return False

        action = getattr(view, 'action', None)
        if action in {'list', 'retrieve'}:
            return (
                _has_role(request, tenant, {AppRole.OWNER, AppRole.ADMIN, AppRole.ASSISTANT})
                or _has_any_permission_code(request, tenant, {'position.view', 'admin.manage_users'})
            )
        if action == 'create':
            return (
                _has_role(request, tenant, {AppRole.OWNER, AppRole.ADMIN})
                or _has_any_permission_code(request, tenant, {'position.create', 'admin.manage_users'})
            )
        if action in {'update', 'partial_update'}:
            return (
                _has_role(request, tenant, {AppRole.OWNER, AppRole.ADMIN})
                or _has_any_permission_code(request, tenant, {'position.update', 'admin.manage_users'})
            )
        if action == 'destroy':
            return (
                _has_role(request, tenant, {AppRole.OWNER, AppRole.ADMIN})
                or _has_any_permission_code(request, tenant, {'position.delete', 'admin.manage_users'})
            )
        return False


class EmployeeAccessPermission(permissions.BasePermission):
    """Access control for employees (funcionÃ¡rios)."""

    message = 'VocÃª nÃ£o tem permissÃ£o para acessar funcionÃ¡rios.'

    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated and request.user.is_superuser:
            return True
        tenant = getattr(request, 'tenant', None)
        if not (request.user and request.user.is_authenticated and tenant):
            return False

        action = getattr(view, 'action', None)
        if action in {'list', 'retrieve'}:
            return (
                _has_role(request, tenant, {AppRole.OWNER, AppRole.ADMIN, AppRole.ASSISTANT})
                or _has_any_permission_code(request, tenant, {'employee.view', 'admin.manage_users'})
            )
        if action == 'create':
            return (
                _has_role(request, tenant, {AppRole.OWNER, AppRole.ADMIN})
                or _has_any_permission_code(request, tenant, {'employee.create', 'admin.manage_users'})
            )
        if action in {'update', 'partial_update'}:
            return (
                _has_role(request, tenant, {AppRole.OWNER, AppRole.ADMIN})
                or _has_any_permission_code(request, tenant, {'employee.update', 'admin.manage_users'})
            )
        if action == 'destroy':
            return (
                _has_role(request, tenant, {AppRole.OWNER, AppRole.ADMIN})
                or _has_any_permission_code(request, tenant, {'employee.delete', 'admin.manage_users'})
            )
        return False


class CauseAccessPermission(permissions.BasePermission):
    """Access control for legal causes (causas)."""

    message = 'VocÃª nÃ£o tem permissÃ£o para acessar causas.'

    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated and request.user.is_superuser:
            return True
        tenant = getattr(request, 'tenant', None)
        if not (request.user and request.user.is_authenticated and tenant):
            return False

        action = getattr(view, 'action', None)
        if action in {'list', 'retrieve'}:
            return (
                _has_role(request, tenant, {AppRole.OWNER, AppRole.ADMIN, AppRole.LAWYER, AppRole.ASSISTANT})
                or _has_any_permission_code(request, tenant, {'cause.view', 'admin.manage_users'})
            )
        if action == 'create':
            return (
                _has_role(request, tenant, {AppRole.OWNER, AppRole.ADMIN, AppRole.LAWYER})
                or _has_any_permission_code(request, tenant, {'cause.create', 'admin.manage_users'})
            )
        if action in {'update', 'partial_update'}:
            return (
                _has_role(request, tenant, {AppRole.OWNER, AppRole.ADMIN, AppRole.LAWYER})
                or _has_any_permission_code(request, tenant, {'cause.update', 'admin.manage_users'})
            )
        if action == 'destroy':
            return (
                _has_role(request, tenant, {AppRole.OWNER, AppRole.ADMIN})
                or _has_any_permission_code(request, tenant, {'cause.delete', 'admin.manage_users'})
            )
        return False

