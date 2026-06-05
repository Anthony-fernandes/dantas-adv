from django.contrib import admin
from .models import Client


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'status', 'tenant', 'email', 'created_at')
    list_filter = ('tenant', 'type', 'status')
    search_fields = ('name', 'doc', 'email')
