from __future__ import annotations

import uuid

from django.db import models
from django.utils import timezone

from apps.core.models import Tenant


class SubscriptionStatus(models.TextChoices):
    TRIAL = 'trial', 'Trial'
    ACTIVE = 'active', 'Active'
    PAST_DUE = 'past_due', 'Past due'
    CANCELED = 'canceled', 'Canceled'


class Plan(models.Model):
    """Billing plan definition.

    This is billing-provider agnostic: we can map to Stripe/PagarMe later.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=40, unique=True)  # free, pro, business
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True, null=True)
    limits = models.JSONField(default=dict, blank=True)  # {users: 3, processes: 200, storage_mb: 1024}
    modules = models.JSONField(default=dict, blank=True)  # {finance: true, documents: true, ...}
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.name


class Subscription(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name='subscription')
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name='subscriptions')
    status = models.CharField(max_length=20, choices=SubscriptionStatus.choices, default=SubscriptionStatus.TRIAL)

    trial_ends_at = models.DateTimeField(blank=True, null=True)
    current_period_end = models.DateTimeField(blank=True, null=True)
    past_due_since = models.DateTimeField(blank=True, null=True)
    canceled_at = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_access_allowed(self) -> bool:
        if self.status in {SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL}:
            if self.status == SubscriptionStatus.TRIAL and self.trial_ends_at and timezone.now() > self.trial_ends_at:
                return False
            return True
        return False

    def __str__(self) -> str:
        return f"{self.tenant.name} - {self.plan.code} ({self.status})"


class UsageSnapshot(models.Model):
    """Optional: snapshot to expose current usage (can be recalculated on demand).

    For now we store only computed fields to avoid expensive counts on every request.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name='usage_snapshot')
    users_count = models.IntegerField(default=0)
    processes_count = models.IntegerField(default=0)
    storage_bytes = models.BigIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)
