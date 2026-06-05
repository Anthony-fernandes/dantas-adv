from __future__ import annotations

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import AppRole, UserAccessPermission, UserRole
from apps.core.models import WorkspaceState


NAMESPACE_RULES = {
    'office_settings': {
        'read_roles': {AppRole.OWNER, AppRole.ADMIN},
        'write_roles': {AppRole.OWNER, AppRole.ADMIN},
        'read_codes': {'admin.settings', 'admin.manage_users', 'position.view'},
        'write_codes': {'admin.settings', 'admin.manage_users', 'position.update'},
    },
    'practice_area_ui': {
        'read_roles': {AppRole.OWNER, AppRole.ADMIN, AppRole.LAWYER, AppRole.ASSISTANT},
        'write_roles': {AppRole.OWNER, AppRole.ADMIN, AppRole.LAWYER},
        'read_codes': {'cause.view', 'admin.manage_users'},
        'write_codes': {'cause.update', 'admin.manage_users'},
    },
    'process_ui': {
        'read_roles': {AppRole.OWNER, AppRole.ADMIN, AppRole.LAWYER, AppRole.ASSISTANT},
        'write_roles': {AppRole.OWNER, AppRole.ADMIN, AppRole.LAWYER, AppRole.ASSISTANT},
        'read_codes': {'process.view'},
        'write_codes': {'process.update'},
    },
    'process_movement_ui': {
        'read_roles': {AppRole.OWNER, AppRole.ADMIN, AppRole.LAWYER, AppRole.ASSISTANT},
        'write_roles': {AppRole.OWNER, AppRole.ADMIN, AppRole.LAWYER, AppRole.ASSISTANT},
        'read_codes': {'process.view'},
        'write_codes': {'process.update'},
    },
    'agenda_meta': {
        'read_roles': {AppRole.OWNER, AppRole.ADMIN, AppRole.LAWYER, AppRole.ASSISTANT},
        'write_roles': {AppRole.OWNER, AppRole.ADMIN, AppRole.LAWYER, AppRole.ASSISTANT},
        'read_codes': set(),
        'write_codes': set(),
    },
    'hearings_workspace': {
        'read_roles': {AppRole.OWNER, AppRole.ADMIN, AppRole.LAWYER, AppRole.ASSISTANT},
        'write_roles': {AppRole.OWNER, AppRole.ADMIN, AppRole.LAWYER, AppRole.ASSISTANT},
        'read_codes': set(),
        'write_codes': set(),
    },
}


def _has_roles(request, roles: set[str]) -> bool:
    if request.user.is_superuser:
        return True
    tenant = getattr(request, 'tenant', None)
    if not tenant or not roles:
        return False
    return UserRole.objects.filter(user=request.user, tenant=tenant, role__in=roles).exists()


def _has_codes(request, codes: set[str]) -> bool:
    if request.user.is_superuser:
        return True
    tenant = getattr(request, 'tenant', None)
    if not tenant or not codes:
        return False
    return UserAccessPermission.objects.filter(user=request.user, tenant=tenant, code__in=codes).exists()


def _resolve_namespace(request):
    namespace = request.query_params.get('namespace') if request.method == 'GET' else request.data.get('namespace')
    namespace = str(namespace or '').strip()
    if not namespace:
        return None, Response({'detail': 'namespace is required.'}, status=400)
    rules = NAMESPACE_RULES.get(namespace)
    if rules is None:
        return None, Response({'detail': 'Unsupported workspace namespace.'}, status=400)
    return namespace, None


def _scope_key_from_request(request):
    value = request.query_params.get('scope_key') if request.method == 'GET' else request.data.get('scope_key')
    return str(value or '').strip()


def _item_key_from_request(request):
    return str(request.data.get('item_key') or '').strip()


def _ensure_access(request, namespace: str, *, write: bool):
    tenant = getattr(request, 'tenant', None)
    if tenant is None:
        return Response({'detail': 'Tenant context is required.'}, status=400)

    rules = NAMESPACE_RULES[namespace]
    role_key = 'write_roles' if write else 'read_roles'
    code_key = 'write_codes' if write else 'read_codes'

    if _has_roles(request, rules[role_key]) or _has_codes(request, rules[code_key]):
        return None

    return Response({'detail': 'You do not have permission to access this workspace state.'}, status=403)


def _serialize(record: WorkspaceState):
    return {
        'id': str(record.id),
        'namespace': record.namespace,
        'scope_key': record.scope_key,
        'item_key': record.item_key,
        'payload': record.payload,
        'created_at': record.created_at,
        'updated_at': record.updated_at,
        'updated_by': str(record.updated_by_id) if record.updated_by_id else None,
    }


class WorkspaceStateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        namespace, error = _resolve_namespace(request)
        if error is not None:
            return error

        access_error = _ensure_access(request, namespace, write=False)
        if access_error is not None:
            return access_error

        scope_key = _scope_key_from_request(request)
        queryset = WorkspaceState.objects.filter(
            tenant=request.tenant,
            namespace=namespace,
            scope_key=scope_key,
        ).order_by('item_key')
        return Response([_serialize(item) for item in queryset])


class WorkspaceStateRecordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):
        namespace, error = _resolve_namespace(request)
        if error is not None:
            return error

        access_error = _ensure_access(request, namespace, write=True)
        if access_error is not None:
            return access_error

        item_key = _item_key_from_request(request)
        if not item_key:
            return Response({'detail': 'item_key is required.'}, status=400)

        payload = request.data.get('payload')
        if payload is None:
            payload = {}

        record, created = WorkspaceState.objects.update_or_create(
            tenant=request.tenant,
            namespace=namespace,
            scope_key=_scope_key_from_request(request),
            item_key=item_key,
            defaults={'payload': payload, 'updated_by': request.user},
        )
        return Response(_serialize(record), status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    def delete(self, request):
        namespace, error = _resolve_namespace(request)
        if error is not None:
            return error

        access_error = _ensure_access(request, namespace, write=True)
        if access_error is not None:
            return access_error

        item_key = _item_key_from_request(request)
        if not item_key:
            return Response({'detail': 'item_key is required.'}, status=400)

        WorkspaceState.objects.filter(
            tenant=request.tenant,
            namespace=namespace,
            scope_key=_scope_key_from_request(request),
            item_key=item_key,
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
