from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User, Profile, UserRole, TenantInvite, EmployeePosition, Employee


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    model = User
    list_display = ('email', 'is_staff', 'is_active', 'is_superuser')
    ordering = ('email',)
    search_fields = ('email',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {'classes': ('wide',), 'fields': ('email', 'password1', 'password2')}),
    )


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'tenant', 'status', 'updated_at')
    search_fields = ('full_name', 'id__email')
    list_filter = ('status', 'tenant')


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ('user', 'tenant', 'role', 'created_at')
    list_filter = ('role', 'tenant')
    search_fields = ('user__email', 'tenant__name')


@admin.register(TenantInvite)
class TenantInviteAdmin(admin.ModelAdmin):
    list_display = ('email', 'tenant', 'role', 'expires_at', 'accepted_at', 'created_at')
    list_filter = ('role', 'tenant')
    search_fields = ('email', 'tenant__name', 'token')


@admin.register(EmployeePosition)
class EmployeePositionAdmin(admin.ModelAdmin):
    list_display = ('name', 'tenant', 'salario_base', 'is_active', 'updated_at')
    list_filter = ('tenant', 'is_active')
    search_fields = ('name', 'tenant__name')


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'tenant', 'position', 'salario', 'user', 'is_active', 'updated_at')
    list_filter = ('tenant', 'position', 'is_active')
    search_fields = ('full_name', 'email', 'phone', 'document_id', 'user__email')
