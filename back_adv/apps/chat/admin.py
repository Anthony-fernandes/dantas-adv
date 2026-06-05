from django.contrib import admin
from .models import ChatMessage


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'tenant', 'process', 'client', 'created_at')
    list_filter = ('tenant',)
    search_fields = ('content', 'sender__email')
