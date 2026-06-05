from django.contrib import admin
from .models import Document, Contract, JobPosition, LegalTemplate, ProcessRichDocument


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('filename', 'category', 'tenant', 'process', 'client', 'created_at')
    list_filter = ('tenant', 'category', 'is_template')
    search_fields = ('filename',)


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ('client', 'type', 'status', 'start_date', 'tenant')
    list_filter = ('tenant', 'status', 'type')


@admin.register(JobPosition)
class JobPositionAdmin(admin.ModelAdmin):
    list_display = ('name', 'tenant', 'created_at')
    list_filter = ('tenant',)


@admin.register(LegalTemplate)
class LegalTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'version', 'is_latest', 'tenant', 'created_at')
    list_filter = ('tenant', 'category', 'is_latest', 'access_level')
    search_fields = ('name', 'description')


@admin.register(ProcessRichDocument)
class ProcessRichDocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'version', 'status', 'is_latest', 'tenant', 'process', 'client', 'updated_at')
    list_filter = ('tenant', 'category', 'status', 'is_latest', 'access_level')
    search_fields = ('title', 'content_html')
