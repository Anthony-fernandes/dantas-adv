from django.contrib import admin

from .models import Plan, Subscription, UsageSnapshot


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'is_active', 'created_at')
    search_fields = ('code', 'name')
    list_filter = ('is_active',)


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('tenant', 'plan', 'status', 'trial_ends_at', 'current_period_end', 'updated_at')
    search_fields = ('tenant__name', 'tenant__slug', 'plan__code')
    list_filter = ('status', 'plan')


@admin.register(UsageSnapshot)
class UsageSnapshotAdmin(admin.ModelAdmin):
    list_display = ('tenant', 'users_count', 'processes_count', 'storage_bytes', 'updated_at')
    search_fields = ('tenant__name', 'tenant__slug')
