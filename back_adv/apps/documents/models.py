import os
import uuid

from django.db import models

from apps.accounts.models import User
from apps.clients.models import Client
from apps.core.models import Tenant
from apps.processes.models import Process


def _compact_ref(value, fallback: str) -> str:
    if not value:
        return fallback
    return str(value).replace("-", "")[:8]


def _compact_filename(filename: str, max_length: int = 60) -> str:
    base_name = os.path.basename(filename or "arquivo")
    stem, ext = os.path.splitext(base_name)
    safe_stem = (stem or "arquivo").strip() or "arquivo"
    safe_ext = ext[:16]
    stem_limit = max(8, max_length - len(safe_ext))
    if len(safe_stem) > stem_limit:
        safe_stem = safe_stem[:stem_limit]
    return f"{safe_stem}{safe_ext}"


def document_upload_to(instance: "Document", filename: str) -> str:
    """Short Windows-friendly path for tenant document uploads."""
    tenant_id = _compact_ref(instance.tenant_id, "tenant")
    group_id = _compact_ref(instance.group_id, "group")
    client_id = _compact_ref(instance.client_id, "")
    process_id = _compact_ref(instance.process_id, "")
    version = instance.version or 1
    short_name = _compact_filename(filename)

    scope = []
    if client_id:
        scope.append(f"c{client_id}")
    if process_id:
        scope.append(f"p{process_id}")
    scope_prefix = "-".join(scope)
    prefix = f"{scope_prefix}-" if scope_prefix else ""

    return f"t/{tenant_id}/d/{group_id}/{prefix}v{version}-{short_name}"


class DocumentAccess(models.TextChoices):
    TENANT = "TENANT", "Tenant"
    ROLES = "ROLES", "Roles"


class TemplateFormat(models.TextChoices):
    RICH_TEXT = "RICH_TEXT", "Rich text"
    PLAIN_TEXT = "PLAIN_TEXT", "Plain text"


class LegalTemplate(models.Model):
    """Template juridico versionado por tenant."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="legal_templates")

    group_id = models.UUIDField(default=uuid.uuid4, db_index=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=120, default="geral")
    format = models.CharField(max_length=20, choices=TemplateFormat.choices, default=TemplateFormat.RICH_TEXT)
    content = models.TextField()

    version = models.IntegerField(default=1)
    is_latest = models.BooleanField(default=True)

    access_level = models.CharField(max_length=16, choices=DocumentAccess.choices, default=DocumentAccess.TENANT)
    allowed_roles = models.JSONField(default=list, blank=True)

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name="created_templates")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name="updated_templates")
    deleted_at = models.DateTimeField(blank=True, null=True, db_index=True)
    deleted_by = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="%(app_label)s_%(class)s_deleted_by",
        related_query_name="%(app_label)s_%(class)s_deleted_by",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["tenant", "created_at"]),
            models.Index(fields=["tenant", "group_id"]),
            models.Index(fields=["tenant", "category", "created_at"]),
        ]

    def mark_not_latest_siblings(self) -> None:
        LegalTemplate.objects.filter(tenant=self.tenant, group_id=self.group_id).exclude(id=self.id).update(is_latest=False)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.is_latest:
            self.mark_not_latest_siblings()


class ProcessRichDocument(models.Model):
    """Word-like editable process document (HTML rich text) with versioning."""

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        FINAL = "FINAL", "Final"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="process_rich_documents")
    process = models.ForeignKey(Process, on_delete=models.SET_NULL, blank=True, null=True, related_name="rich_documents")
    client = models.ForeignKey(Client, on_delete=models.SET_NULL, blank=True, null=True, related_name="rich_documents")

    group_id = models.UUIDField(default=uuid.uuid4, db_index=True)
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=120, default="peticao")
    content_html = models.TextField(default="", blank=True)

    version = models.IntegerField(default=1)
    is_latest = models.BooleanField(default=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)

    access_level = models.CharField(max_length=16, choices=DocumentAccess.choices, default=DocumentAccess.TENANT)
    allowed_roles = models.JSONField(default=list, blank=True)

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name="created_rich_documents")
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name="updated_rich_documents")
    deleted_at = models.DateTimeField(blank=True, null=True, db_index=True)
    deleted_by = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="%(app_label)s_%(class)s_deleted_by",
        related_query_name="%(app_label)s_%(class)s_deleted_by",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["tenant", "created_at"]),
            models.Index(fields=["tenant", "group_id"]),
            models.Index(fields=["tenant", "process", "created_at"]),
            models.Index(fields=["tenant", "client", "created_at"]),
            models.Index(fields=["tenant", "status", "created_at"]),
        ]

    def mark_not_latest_siblings(self) -> None:
        ProcessRichDocument.objects.filter(tenant=self.tenant, group_id=self.group_id).exclude(id=self.id).update(is_latest=False)

    def save(self, *args, **kwargs):
        if self.version is None or self.version < 1:
            self.version = 1
        super().save(*args, **kwargs)
        if self.is_latest:
            self.mark_not_latest_siblings()


class Document(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="documents")
    process = models.ForeignKey(Process, on_delete=models.SET_NULL, blank=True, null=True, related_name="documents")
    client = models.ForeignKey(Client, on_delete=models.SET_NULL, blank=True, null=True, related_name="documents")
    group_id = models.UUIDField(default=uuid.uuid4, db_index=True)
    title = models.CharField(max_length=255, blank=True, null=True)
    filename = models.CharField(max_length=255)
    file = models.FileField(upload_to=document_upload_to, blank=True, null=True, max_length=500)
    file_url = models.URLField(blank=True, null=True)
    file_size = models.BigIntegerField(blank=True, null=True)
    content_type = models.CharField(max_length=120, blank=True, null=True)
    category = models.CharField(max_length=120, default="geral")
    version = models.IntegerField(default=1)
    is_latest = models.BooleanField(default=True)
    is_template = models.BooleanField(default=False)
    access_level = models.CharField(max_length=16, choices=DocumentAccess.choices, default=DocumentAccess.TENANT)
    allowed_roles = models.JSONField(default=list, blank=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name="uploaded_documents")
    deleted_at = models.DateTimeField(blank=True, null=True, db_index=True)
    deleted_by = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="%(app_label)s_%(class)s_deleted_by",
        related_query_name="%(app_label)s_%(class)s_deleted_by",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["tenant", "created_at"]),
            models.Index(fields=["tenant", "group_id"]),
            models.Index(fields=["tenant", "process", "created_at"]),
            models.Index(fields=["tenant", "client", "created_at"]),
        ]

    def mark_not_latest_siblings(self) -> None:
        Document.objects.filter(tenant=self.tenant, group_id=self.group_id).exclude(id=self.id).update(is_latest=False)

    def save(self, *args, **kwargs):
        if not self.title:
            self.title = self.filename
        if self.version is None or self.version < 1:
            self.version = 1
        super().save(*args, **kwargs)
        if self.is_latest:
            self.mark_not_latest_siblings()


class Contract(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="contracts")
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="contracts")
    type = models.CharField(max_length=50, default="fixo")
    percent = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    fixed_value = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    start_date = models.DateField()
    end_date = models.DateField(blank=True, null=True)
    clauses = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=30, default="vigente")
    deleted_at = models.DateTimeField(blank=True, null=True, db_index=True)
    deleted_by = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="%(app_label)s_%(class)s_deleted_by",
        related_query_name="%(app_label)s_%(class)s_deleted_by",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class JobPosition(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="job_positions")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    default_permissions = models.JSONField(default=list, blank=True)
    deleted_at = models.DateTimeField(blank=True, null=True, db_index=True)
    deleted_by = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="%(app_label)s_%(class)s_deleted_by",
        related_query_name="%(app_label)s_%(class)s_deleted_by",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return self.name


class SignatureRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        SENT = 'sent', 'Sent'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey('core.Tenant', on_delete=models.CASCADE, related_name='signature_requests')
    document = models.ForeignKey(ProcessRichDocument, on_delete=models.CASCADE, related_name='signature_requests')
    provider = models.CharField(max_length=30, default='internal')
    deadline = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    signing_url = models.URLField(blank=True, null=True)
    external_id = models.CharField(max_length=255, blank=True, null=True)
    signers = models.JSONField(default=list)
    created_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='created_signature_requests')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
