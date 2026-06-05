from __future__ import annotations

import json

from django.core.serializers.json import DjangoJSONEncoder
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.views import APIView

from apps.accounts.models import AppRole, UserRole
from apps.core.permissions import IsTenantMember
from apps.clients.models import Client
from apps.processes.models import Process, Deadline, Hearing, Movement, LegalCause
from apps.finance.models import AccountsReceivable, AccountsPayable, Invoice, Payment, ReceivableInstallment
from apps.documents.models import Document, LegalTemplate
from apps.accounts.models import EmployeePosition, Employee
from apps.core.models import LandingPage, LandingLead


class TenantExportView(APIView):
    """LGPD export: tenant-scoped data as JSON.

    Notes:
      - Does not include binary file contents; includes only metadata.
      - Requires OWNER or ADMIN.
    """

    permission_classes = [IsTenantMember]

    def get(self, request):
        tenant = getattr(request, 'tenant', None)
        if tenant is None:
            return HttpResponse(
                json.dumps({'error': {'code': 'TENANT_REQUIRED', 'message': 'Tenant obrigatório', 'details': None, 'request_id': getattr(request, 'request_id', None)}}, cls=DjangoJSONEncoder),
                content_type='application/json',
                status=400,
            )

        roles = set(UserRole.objects.filter(user=request.user, tenant=tenant).values_list('role', flat=True))
        if not (AppRole.OWNER in roles or AppRole.ADMIN in roles):
            return HttpResponse(
                json.dumps({'error': {'code': 'FORBIDDEN', 'message': 'Sem permissão para exportar dados do tenant.', 'details': None, 'request_id': getattr(request, 'request_id', None)}}, cls=DjangoJSONEncoder),
                content_type='application/json',
                status=403,
            )

        payload = {
            'tenant': {
                'id': str(tenant.id),
                'name': tenant.name,
                'slug': tenant.slug,
                'created_at': tenant.created_at,
            },
            'exported_at': timezone.now(),
            'clients': list(Client.objects.filter(tenant=tenant, deleted_at__isnull=True).values()),
            'employee_positions': list(EmployeePosition.objects.filter(tenant=tenant).values()),
            'employees': list(Employee.objects.filter(tenant=tenant).values()),
            'causes': list(LegalCause.objects.filter(tenant=tenant).values()),
            'landing_page': LandingPage.objects.filter(tenant=tenant).values().first(),
            'landing_leads': list(LandingLead.objects.filter(tenant=tenant).values()),
            'processes': list(Process.objects.filter(tenant=tenant, deleted_at__isnull=True).values()),
            'movements': list(Movement.objects.filter(tenant=tenant, deleted_at__isnull=True).values()),
            'deadlines': list(Deadline.objects.filter(tenant=tenant, deleted_at__isnull=True).values()),
            'hearings': list(Hearing.objects.filter(tenant=tenant, deleted_at__isnull=True).values()),
            'finance': {
                'receivables': list(AccountsReceivable.objects.filter(tenant=tenant, deleted_at__isnull=True).values()),
                'installments': list(ReceivableInstallment.objects.filter(tenant=tenant, deleted_at__isnull=True).values()),
                'payables': list(AccountsPayable.objects.filter(tenant=tenant, deleted_at__isnull=True).values()),
                'invoices': list(Invoice.objects.filter(tenant=tenant, deleted_at__isnull=True).values()),
                'payments': list(Payment.objects.filter(tenant=tenant, deleted_at__isnull=True).values()),
            },
            'documents': list(
                Document.objects.filter(tenant=tenant, deleted_at__isnull=True)
                .values('id', 'title', 'category', 'client_id', 'process_id', 'access_level', 'allowed_roles', 'group_id', 'version', 'is_latest', 'created_at')
            ),
            'templates': list(
                LegalTemplate.objects.filter(tenant=tenant)
                .values('id', 'name', 'category', 'access_level', 'allowed_roles', 'group_id', 'version', 'is_latest', 'created_at', 'updated_at')
            ),
        }

        content = json.dumps(payload, cls=DjangoJSONEncoder, ensure_ascii=False)
        filename = f"tenant_export_{tenant.slug or tenant.id}_{timezone.now().date().isoformat()}.json"
        resp = HttpResponse(content, content_type='application/json; charset=utf-8')
        resp['Content-Disposition'] = f'attachment; filename="{filename}"'
        return resp
