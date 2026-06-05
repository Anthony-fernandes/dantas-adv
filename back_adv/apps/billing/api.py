from __future__ import annotations

from django.db import models
from rest_framework import permissions, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import IsOwnerOrAdmin

from .models import Plan, Subscription, UsageSnapshot
from .services import ensure_subscription_for_tenant

from apps.accounts.models import UserRole
from apps.processes.models import Process
from apps.documents.models import Document


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = ['id', 'code', 'name', 'description', 'limits', 'modules', 'is_active']


class SubscriptionSerializer(serializers.ModelSerializer):
    plan = PlanSerializer(read_only=True)

    class Meta:
        model = Subscription
        fields = ['id', 'status', 'trial_ends_at', 'current_period_end', 'past_due_since', 'canceled_at', 'plan']


class UsageSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = UsageSnapshot
        fields = ['users_count', 'processes_count', 'storage_bytes', 'updated_at']


class BillingViewSet(viewsets.ViewSet):
    """Billing endpoints (provider agnostic)."""

    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    @action(detail=False, methods=['get'], url_path='plans', permission_classes=[permissions.AllowAny])
    def plans(self, request):
        qs = Plan.objects.filter(is_active=True).order_by('code')
        return Response(PlanSerializer(qs, many=True).data)

    @action(detail=False, methods=['get'], url_path='status')
    def status(self, request):
        tenant = request.tenant
        sub = ensure_subscription_for_tenant(tenant)
        usage, _ = UsageSnapshot.objects.get_or_create(tenant=tenant)

        # Refresh usage snapshot (cheap aggregates)
        usage.users_count = UserRole.objects.filter(tenant=tenant).values('user_id').distinct().count()
        usage.processes_count = Process.objects.filter(tenant=tenant).count()
        usage.storage_bytes = Document.objects.filter(tenant=tenant).exclude(file_size__isnull=True).aggregate(
            s=models.Sum('file_size')
        )['s'] or 0
        usage.save(update_fields=['users_count', 'processes_count', 'storage_bytes', 'updated_at'])
        payload = {
            'subscription': SubscriptionSerializer(sub).data,
            'usage': UsageSnapshotSerializer(usage).data,
        }
        return Response(payload)
