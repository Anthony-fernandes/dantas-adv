import uuid
from django.db import models

from apps.core.models import Tenant
from apps.processes.models import Process
from apps.clients.models import Client
from apps.accounts.models import User


class ChatMessage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='chat_messages')
    process = models.ForeignKey(Process, on_delete=models.SET_NULL, blank=True, null=True, related_name='chat_messages')
    client = models.ForeignKey(Client, on_delete=models.SET_NULL, blank=True, null=True, related_name='chat_messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_chat_messages')
    content = models.TextField()
    attachments = models.JSONField(default=list, blank=True)
    read_by = models.JSONField(default=list, blank=True)  # list of user UUIDs
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.sender.email}: {self.content[:30]}"
