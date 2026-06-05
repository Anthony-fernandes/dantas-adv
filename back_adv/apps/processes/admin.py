from django.contrib import admin
from .models import Process, Movement, Deadline, Hearing, LegalCause


@admin.register(Process)
class ProcessAdmin(admin.ModelAdmin):
    list_display = ('cnj', 'status', 'area', 'cause', 'phase', 'tenant', 'client', 'updated_at')
    list_filter = ('tenant', 'status', 'area', 'cause', 'phase')
    search_fields = ('cnj', 'plaintiff', 'defendant', 'client__name')


@admin.register(LegalCause)
class LegalCauseAdmin(admin.ModelAdmin):
    list_display = ('name', 'area', 'tenant', 'is_active', 'updated_at')
    list_filter = ('tenant', 'area', 'is_active')
    search_fields = ('name', 'description')


@admin.register(Movement)
class MovementAdmin(admin.ModelAdmin):
    list_display = ('process', 'type', 'date', 'tenant', 'created_at')
    list_filter = ('tenant', 'type')


@admin.register(Deadline)
class DeadlineAdmin(admin.ModelAdmin):
    list_display = ('process', 'due_date', 'priority', 'status', 'tenant')
    list_filter = ('tenant', 'priority', 'status')


@admin.register(Hearing)
class HearingAdmin(admin.ModelAdmin):
    list_display = ('process', 'hearing_date', 'modality', 'status', 'tenant')
    list_filter = ('tenant', 'modality', 'status')
