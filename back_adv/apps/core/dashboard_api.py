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
