from __future__ import annotations

from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from .models import Plan, Subscription, SubscriptionStatus, UsageSnapshot


DEFAULT_PLANS = [
    {
        'code': 'free',
        'name': 'Free',
        'description': 'Plano gratuito',
        'limits': {'users': 2, 'processes': 50, 'storage_mb': 256},
        'modules': {'legal': True, 'documents': True, 'finance': False},
    },
    {
        'code': 'pro',
        'name': 'Pro',
        'description': 'Plano profissional',
        'limits': {'users': 10, 'processes': 1000, 'storage_mb': 2048},
        'modules': {'legal': True, 'documents': True, 'finance': True},
    },
    {
        'code': 'business',
        'name': 'Business',
        'description': 'Plano Business',
        'limits': {'users': 50, 'processes': 5000, 'storage_mb': 10240},
        'modules': {'legal': True, 'documents': True, 'finance': True},
    },
]


def ensure_default_plans() -> None:
    for p in DEFAULT_PLANS:
        Plan.objects.update_or_create(
            code=p['code'],
            defaults={
                'name': p['name'],
                'description': p.get('description'),
                'limits': p.get('limits', {}),
                'modules': p.get('modules', {}),
                'is_active': True,
            },
        )


def ensure_subscription_for_tenant(tenant, plan_code: str = 'free'):
    """Create default subscription + usage snapshot for a tenant."""

    ensure_default_plans()
    plan = Plan.objects.get(code=plan_code)
    trial_days = int(getattr(settings, 'BILLING_TRIAL_DAYS', 14))
    now = timezone.now()
    sub, created = Subscription.objects.get_or_create(
        tenant=tenant,
        defaults={
            'plan': plan,
            'status': SubscriptionStatus.TRIAL,
            'trial_ends_at': now + timedelta(days=trial_days),
            'current_period_end': now + timedelta(days=trial_days),
        },
    )
    if not created and sub.plan_id is None:
        sub.plan = plan
        sub.save(update_fields=['plan', 'updated_at'])
    UsageSnapshot.objects.get_or_create(tenant=tenant)
    return sub
