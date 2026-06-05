import uuid
from django.db import models

from apps.core.models import Tenant
from apps.accounts.models import User


class ClientType(models.TextChoices):
    PF = 'PF', 'PF'
    PJ = 'PJ', 'PJ'


class ClientStatus(models.TextChoices):
    ATIVO = 'ativo', 'Ativo'
    INATIVO = 'inativo', 'Inativo'
    PROSPECTO = 'prospecto', 'Prospecto'


class Client(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='clients')
    type = models.CharField(max_length=2, choices=ClientType.choices, default=ClientType.PF)
    name = models.CharField(max_length=255)
    trade_name = models.CharField(max_length=255, blank=True, null=True)
    doc = models.CharField(max_length=60, blank=True, null=True)
    rg_ie = models.CharField(max_length=60, blank=True, null=True)
    birth_date = models.DateField(blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phones = models.JSONField(default=list, blank=True)
    whatsapp = models.CharField(max_length=50, blank=True, null=True)
    address = models.JSONField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    tags = models.JSONField(default=list, blank=True)  # stored as list
    status = models.CharField(max_length=20, choices=ClientStatus.choices, default=ClientStatus.ATIVO)
    responsible_user = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='responsible_clients')
    portal_user = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='portal_clients')
    deleted_at = models.DateTimeField(blank=True, null=True, db_index=True)
    deleted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='deleted_client')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.name
