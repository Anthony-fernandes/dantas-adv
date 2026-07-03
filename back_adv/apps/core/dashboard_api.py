from __future__ import annotations

from datetime import timedelta

from django.db.models import Count
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsTenantMember, IsLegal
from apps.processes.models import Process, ProcessStatus, Deadline, DeadlineStatus, Hearing, HearingStatus


class LegalDashboardView(APIView):
    permission_classes = [IsTenantMember, IsLegal]

    def get(self, request):
        tenant = request.tenant
        now = timezone.now()
        window_days = int(request.query_params.get('window_days', 7) or 7)
        end = now + timedelta(days=window_days)

        # Processes
        active_statuses = [
            ProcessStatus.PRE_PROCESSUAL,
            ProcessStatus.EM_ANDAMENTO,
            ProcessStatus.SUSPENSO,
        ]
        active_processes = Process.objects.filter(tenant=tenant, status__in=active_statuses).count()

        processes_by_status = list(
            Process.objects.filter(tenant=tenant)
            .values('status')
            .annotate(count=Count('id'))
            .order_by('status')
        )

        # Deadlines (next 7 days)
        deadlines_week = Deadline.objects.filter(
            tenant=tenant,
            status__in=[DeadlineStatus.PENDENTE, DeadlineStatus.ATRASADO],
            due_date__gte=now,
            due_date__lte=end,
        ).select_related('process', 'responsible')

        deadlines_week_count = deadlines_week.count()
        deadlines_overdue_count = Deadline.objects.filter(
            tenant=tenant,
            status=DeadlineStatus.ATRASADO,
        ).count()

        deadlines_next = list(
            deadlines_week.order_by('due_date')[:10]
            .values('id', 'description', 'due_date', 'status', 'priority', 'process_id')
        )

        # Hearings (next 7 days)
        hearings_upcoming = Hearing.objects.filter(
            tenant=tenant,
            status=HearingStatus.AGENDADA,
            hearing_date__gte=now,
            hearing_date__lte=end,
        ).select_related('process', 'responsible')
        hearings_upcoming_count = hearings_upcoming.count()
        hearings_next = list(
            hearings_upcoming.order_by('hearing_date')[:10]
            .values('id', 'type', 'hearing_date', 'status', 'modality', 'process_id')
        )

        return Response(
            {
                'window_days': window_days,
                'active_processes': active_processes,
                'deadlines_week': deadlines_week_count,
                'deadlines_overdue': deadlines_overdue_count,
                'hearings_upcoming': hearings_upcoming_count,
                'processes_by_status': processes_by_status,
                'deadlines_next': deadlines_next,
                'hearings_next': hearings_next,
            }
        )


class StrategicDashboardView(APIView):
    """Payload unico e limitado para o dashboard estrategico.

    Substitui o padrao anterior do frontend (baixar TODAS as paginas de
    11 recursos) por 1 requisicao com listas enxutas e janeladas.
    Contagens all-time por status vem em `process_totals` para que os
    KPIs nao dependam do cap.
    """

    permission_classes = [IsTenantMember, IsLegal]

    PROCESS_CAP = 2000
    DEADLINE_CAP = 1500
    HEARING_CAP = 1000
    ACTIVITY_CAP = 300
    FINANCE_CAP = 3000

    def get(self, request):
        from datetime import timedelta as _td

        from apps.accounts.models import AppRole, UserRole, Employee
        from apps.clients.models import Client
        from apps.documents.models import Document
        from apps.finance.models import AccountsPayable, AccountsReceivable, Payment
        from apps.processes.models import LegalCause, Movement

        tenant = request.tenant
        now = timezone.now()
        today = now.date()

        include_finance = request.query_params.get('include_finance') == '1'
        if include_finance and not request.user.is_superuser:
            include_finance = UserRole.objects.filter(
                user=request.user,
                tenant=tenant,
                role__in=[AppRole.OWNER, AppRole.ADMIN, AppRole.FINANCE],
            ).exists()

        processes = list(
            Process.objects.filter(tenant=tenant, deleted_at__isnull=True)
            .select_related('client', 'responsible_lawyer')
            .order_by('-updated_at')[: self.PROCESS_CAP]
        )
        processes_payload = [
            {
                'id': str(p.id),
                'cnj': p.cnj,
                'court': p.court,
                'court_division': p.court_division,
                'class_name': p.class_name,
                'subject': p.subject,
                'area': p.area,
                'phase': p.phase,
                'status': p.status,
                'probability': p.probability,
                'cause_value': str(p.cause_value) if p.cause_value is not None else None,
                'plaintiff': p.plaintiff,
                'defendant': p.defendant,
                'client': str(p.client_id) if p.client_id else None,
                'client_name': p.client.name if p.client else None,
                'responsaveis': (
                    [{
                        'id': str(p.responsible_lawyer_id),
                        'name': getattr(p.responsible_lawyer, 'full_name', None) or getattr(p.responsible_lawyer, 'email', None),
                    }]
                    if p.responsible_lawyer_id else []
                ),
                'created_at': p.created_at.isoformat() if p.created_at else None,
                'updated_at': p.updated_at.isoformat() if p.updated_at else None,
            }
            for p in processes
        ]

        process_totals = list(
            Process.objects.filter(tenant=tenant, deleted_at__isnull=True)
            .values('status').annotate(count=Count('id')).order_by('status')
        )

        deadlines = list(
            Deadline.objects.filter(tenant=tenant, deleted_at__isnull=True, due_date__gte=today - _td(days=365))
            .order_by('due_date')[: self.DEADLINE_CAP]
            .values('id', 'description', 'due_date', 'status', 'priority', 'process_id', 'created_at')
        )
        hearings = list(
            Hearing.objects.filter(tenant=tenant, deleted_at__isnull=True, hearing_date__gte=now - _td(days=180))
            .order_by('hearing_date')[: self.HEARING_CAP]
            .values('id', 'type', 'hearing_date', 'end_date', 'status', 'modality', 'location', 'process_id', 'created_at')
        )
        movements = list(
            Movement.objects.filter(tenant=tenant, deleted_at__isnull=True, date__gte=today - _td(days=60))
            .order_by('-date', '-created_at')[: self.ACTIVITY_CAP]
            .values('id', 'type', 'description', 'date', 'process_id', 'created_at')
        )
        documents = list(
            Document.objects.filter(tenant=tenant, deleted_at__isnull=True, created_at__gte=now - _td(days=60))
            .order_by('-created_at')[: self.ACTIVITY_CAP]
            .values('id', 'title', 'filename', 'category', 'process_id', 'client_id', 'created_at', 'file_size')
        )
        clients = list(
            Client.objects.filter(tenant=tenant, deleted_at__isnull=True)
            .order_by('-updated_at')[: self.PROCESS_CAP]
            .values('id', 'name', 'type', 'status', 'created_at', 'updated_at')
        )
        employees = list(
            Employee.objects.filter(tenant=tenant).order_by('full_name')
            .values('id', 'full_name', 'email', 'is_active', 'created_at', 'updated_at')
        )
        areas = list(
            LegalCause.objects.filter(tenant=tenant).order_by('name')
            .values('id', 'name', 'area', 'is_active')
        )

        finance_window = today - _td(days=365)
        receivables, payables, payments = [], [], []
        if include_finance:
            receivables = list(
                AccountsReceivable.objects.filter(tenant=tenant, deleted_at__isnull=True, due_date__gte=finance_window)
                .order_by('-due_date')[: self.FINANCE_CAP]
                .values('id', 'description', 'amount', 'status', 'due_date', 'paid_date', 'client_id', 'process_id', 'created_at')
            )
            payables = list(
                AccountsPayable.objects.filter(tenant=tenant, deleted_at__isnull=True, due_date__gte=finance_window)
                .order_by('-due_date')[: self.FINANCE_CAP]
                .values('id', 'description', 'amount', 'status', 'due_date', 'supplier', 'process_id', 'created_at')
            )
            payments = list(
                Payment.objects.filter(tenant=tenant, deleted_at__isnull=True, payment_date__gte=finance_window)
                .order_by('-payment_date')[: self.FINANCE_CAP]
                .values('id', 'amount', 'payment_date', 'method', 'receivable_id', 'client_id', 'process_id', 'created_at')
            )

        legal_summary = LegalDashboardView().get(request).data

        return Response({
            'legal_summary': legal_summary,
            'process_totals': process_totals,
            'processes': processes_payload,
            'deadlines': deadlines,
            'hearings': hearings,
            'movements': movements,
            'documents': documents,
            'clients': clients,
            'employees': employees,
            'areas': areas,
            'receivables': receivables,
            'payables': payables,
            'payments': payments,
        })
