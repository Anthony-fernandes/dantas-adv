from __future__ import annotations

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.processes.models import Deadline, DeadlineStatus


class Command(BaseCommand):
    help = 'Mark overdue deadlines and trigger notifications (safe to run periodically).' 

    def add_arguments(self, parser):
        parser.add_argument('--window-hours', type=int, default=24, help='Lookback window for newly overdue deadlines')

    @transaction.atomic
    def handle(self, *args, **options):
        now = timezone.now()
        window_hours = int(options['window_hours'])
        lookback = now - timedelta(hours=window_hours)

        qs = Deadline.objects.select_for_update().filter(
            status=DeadlineStatus.PENDENTE,
            due_date__lt=now,
            due_date__gte=lookback,
        )
        updated = qs.update(status=DeadlineStatus.ATRASADO)
        self.stdout.write(self.style.SUCCESS(f'Marked {updated} deadlines as overdue.'))
