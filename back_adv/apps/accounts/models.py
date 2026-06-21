import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

from apps.core.models import Tenant

from django.contrib.auth.base_user import BaseUserManager

class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email é obrigatório")
        email = self.normalize_email(email)

        # AbstractUser ainda tem campo username; como você deixou opcional,
        # vamos preencher automaticamente se vier vazio.
        extra_fields.setdefault("username", email)

        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser precisa de is_staff=True")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser precisa de is_superuser=True")

        return self._create_user(email, password, **extra_fields)

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150, blank=True, null=True, unique=False)
    email = models.EmailField(unique=True)

    USERNAME_FIELD = 'email'
    # Keep authentication by email, but ask username on createsuperuser.
    REQUIRED_FIELDS = ['username']

    objects = UserManager()

    lgpd_accepted_at = models.DateTimeField(blank=True, null=True)

    def __str__(self) -> str:
        return self.email


class Profile(models.Model):
    id = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, related_name='profile')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='profiles', null=True, blank=True)
    full_name = models.CharField(max_length=255, default='', blank=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    oab = models.CharField(max_length=30, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    avatar_url = models.URLField(blank=True, null=True)
    cargo = models.CharField(max_length=120, blank=True, null=True)
    status = models.CharField(max_length=30, default='active')
    notification_prefs = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.full_name or self.id.email


class AppRole(models.TextChoices):
    OWNER = 'OWNER', 'Owner'
    ADMIN = 'ADMIN', 'Admin'
    LAWYER = 'LAWYER', 'Lawyer'
    ASSISTANT = 'ASSISTANT', 'Assistant'
    FINANCE = 'FINANCE', 'Finance'
    CLIENT = 'CLIENT', 'Client'

    @classmethod
    def normalize(cls, value: str) -> str:
        if not value:
            raise ValueError('role is required')
        v = str(value).strip()
        legacy_map = {
            'socio': cls.OWNER,
            'owner': cls.OWNER,
            'ADMIN': cls.ADMIN,
            'admin': cls.ADMIN,
            'advogado': cls.LAWYER,
            'lawyer': cls.LAWYER,
            'assistente': cls.ASSISTANT,
            'assistant': cls.ASSISTANT,
            'financeiro': cls.FINANCE,
            'finance': cls.FINANCE,
            'cliente': cls.CLIENT,
            'client': cls.CLIENT,
        }
        return legacy_map.get(v, v)



class UserRole(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='roles')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='user_roles')
    role = models.CharField(max_length=20, choices=AppRole.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (('user', 'tenant', 'role'),)

    def __str__(self) -> str:
        return f"{self.user.email} - {self.tenant.name} - {self.role}"


class UserAccessPermission(models.Model):
    """Tenant-scoped custom permissions assigned directly to users."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='access_permissions')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='user_access_permissions')
    code = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (('user', 'tenant', 'code'),)
        indexes = [
            models.Index(fields=['tenant', 'user']),
            models.Index(fields=['tenant', 'code']),
        ]

    def __str__(self) -> str:
        return f"{self.user.email} - {self.tenant.name} - {self.code}"


class EmployeePosition(models.Model):
    """Tenant-scoped job position (cargo)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='employee_positions')
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True, null=True)
    salario_base = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = (('tenant', 'name'),)
        indexes = [
            models.Index(fields=['tenant', 'name']),
            models.Index(fields=['tenant', 'is_active']),
        ]

    def __str__(self) -> str:
        return self.name


class Employee(models.Model):
    """Employee registry with optional system-user linkage."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='employees')
    position = models.ForeignKey(EmployeePosition, on_delete=models.PROTECT, related_name='employees')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')

    full_name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    document_id = models.CharField(max_length=32, blank=True, null=True)  # cpf/rg/registro interno

    hire_date = models.DateField(blank=True, null=True)
    termination_date = models.DateField(blank=True, null=True)
    salario = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = (('tenant', 'user'),)
        indexes = [
            models.Index(fields=['tenant', 'full_name']),
            models.Index(fields=['tenant', 'is_active']),
            models.Index(fields=['tenant', 'position']),
            models.Index(fields=['tenant', 'document_id']),
        ]

    def __str__(self) -> str:
        return self.full_name


class TenantInvite(models.Model):
    """Invitation token for a user to join a tenant with a given role."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='invites')
    email = models.EmailField()
    role = models.CharField(max_length=20, choices=AppRole.choices)
    token = models.CharField(max_length=255, unique=True)
    expires_at = models.DateTimeField()
    invited_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sent_invites',
    )
    accepted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['tenant', 'email']),
            models.Index(fields=['token']),
        ]

    @property
    def is_accepted(self) -> bool:
        return self.accepted_at is not None

    def __str__(self) -> str:
        return f"Invite {self.email} -> {self.tenant.name} ({self.role})"
