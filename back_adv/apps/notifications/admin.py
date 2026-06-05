from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'type', 'user', 'read', 'tenant', 'created_at')
    list_filter = ('tenant', 'type', 'read')
    search_fields = ('title', 'message', 'user__email')
